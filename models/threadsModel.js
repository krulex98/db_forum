const db = require('../db/connection');
const errors = require('../errors/errors');

class threadsModel {
	static async createPost(slugOrId, posts) {
		const numbersPattern = '^[0-9]+$';
		let threadQuery = 'SELECT * FROM threads ';
		if (slugOrId.match(numbersPattern)) {
			threadQuery += 'WHERE id = ${slugOrId}';
		} else {
			threadQuery += 'WHERE slug = ${slugOrId}';
		}

		let thread = {};
		try {
			thread = await db.one(threadQuery, {slugOrId: slugOrId});
		} catch (error) {
			throw new errors.NotFoundError();
		}

		if (posts.length === 0) {
			return [];
		}

		let query = 'INSERT INTO posts(username, message, thread_id, parent_id) VALUES ';
		for (let i = 0; i < posts.length; i++) {
			const post = posts[i];

			let user = {};
			try {
				user = await db.one('SELECT nickname FROM users WHERE nickname = ${post.author}', {post: post});
			} catch (error) {
				throw new errors.NotFoundError();
			}

			query += ` ('${user.nickname}', '${post.message}', ${thread.id}, `;
			if (!post.parent) {
				query += `${post.parent})`;
			} else {
				try {
					const parentPost = await db.one('SELECT * FROM posts WHERE id = ${post.parent} AND thread_id = ${thread.id}',
						{post: post, thread: thread});
					query += `${parentPost.id})`;
				} catch (error) {
					throw new errors.AlreadyExistsError();
				}
			}
			if (i < posts.length - 1) {
				query += ', ';
			}
		}
		query += 'RETURNING username as author, created, id, isEdited, message, parent_id as parent, thread_id as thread ';

		let savedPosts = await db.manyOrNone(query);
		savedPosts.forEach(savedPost => {
			savedPost.forum = thread.forum_slug;
		});

		try {
			await db.one('UPDATE forums SET posts = posts + ${posts.length} WHERE slug = ${thread.forum_slug} RETURNING *', {
				posts: posts, thread: thread
			});
		} catch (error) {
			console.log(error);
		}
		return savedPosts;
	}

	static async getDetails(slugOrId) {
		const numbersPattern = '^[0-9]+$';
		let threadQuery = 'SELECT username as author, created, forum_slug as forum, id, message, title, slug, votes FROM threads ';
		if (slugOrId.match(numbersPattern)) {
			threadQuery += 'WHERE id = ${slugOrId}';
		} else {
			threadQuery += 'WHERE slug = ${slugOrId}';
		}

		try {
			return await db.one(threadQuery, {slugOrId: slugOrId});
		} catch (error) {
			throw new errors.NotFoundError();
		}
	}

	static async updateDetails(slugOrId, thread) {
		let query = 'UPDATE threads SET message = COALESCE(${thread.message}, message), title = COALESCE(${thread.title}, title)';
		const numbersPattern = '^[0-9]+$';
		if (slugOrId.match(numbersPattern)) {
			query += 'WHERE id = ${slugOrId} ';
		} else {
			query += 'WHERE slug = ${slugOrId} ';
		}
		query += 'RETURNING username as author, created, forum_slug as forum, id, message, title, slug';

		try {
			return await db.one(query, {thread: thread, slugOrId: slugOrId});
		} catch (error) {
			throw new errors.NotFoundError();
		}
	}

	static async voteBySlug(threadSlug, vote) {
		try {
			 await db.any('INSERT INTO votes(username, thread_id, voice) VALUES (' +
				'${vote.nickname}, ' +
				'(SELECT id FROM threads WHERE slug = ${threadSlug}), ' +
				'${vote.voice}) ' +
				'ON CONFLICT ON CONSTRAINT unique_vote ' +
				'DO UPDATE SET voice = ${vote.voice} ' +
				'WHERE votes.thread_id = (SELECT id FROM threads WHERE slug = ${threadSlug}) AND votes.username = ${vote.nickname} ' +
				'RETURNING votes.id',
				{threadSlug: threadSlug, vote: vote});
			 return await this.getDetails(threadSlug);
		} catch (error) {
			throw new errors.NotFoundError();
		}
	}

	static async voteById(threadId, vote) {
		try {
			await db.any('INSERT INTO votes(username, thread_id, voice) VALUES (' +
				'${vote.nickname}, ' +
				'${threadId}, ' +
				'${vote.voice}) ' +
				'ON CONFLICT ON CONSTRAINT unique_vote ' +
				'DO UPDATE SET voice = ${vote.voice} ' +
				'WHERE votes.thread_id = ${threadId} AND votes.username = ${vote.nickname} ' +
				'RETURNING votes.id',
				{threadId: threadId, vote: vote});
			return await this.getDetails(threadId);
		} catch (error) {
			throw new errors.NotFoundError();
		}
	}

	static async getPostsBySlug(slug, params) {
		let thread;
		try {
			thread = await db.one('SELECT * FROM threads WHERE slug = ${slug}', {slug: slug});
		} catch (error) {
			throw new errors.NotFoundError();
		}

		return await this.getPosts(thread, params);
	}

	static async getPostsById(id, params) {
		let thread;
		try {
			thread = await db.one('SELECT * FROM threads WHERE id = ${id}', {id: id});
		} catch (error) {
			throw new errors.NotFoundError();
		}

		return await this.getPosts(thread, params);
	}

	static async getPosts(thread, params) {
		let posts = [];
		try {
			switch (params.sort) {
				case 'tree':
					posts = await this.getPostsTree(thread, params);
					break;
				case 'parent_tree':
					posts = await this.getPostsParentTree(thread, params);
					break;
				default:
					posts = await this.getPostsFlat(thread, params);
			}
		}
		catch (error) {
			throw new Error(error);
		}
		posts.forEach(post => {
			post.isEdited = post.isedited;
			post.forum = thread.forum_slug;
			delete post.isedited;
		});
		return posts;
	}

	static async getPostsFlat(thread, params) {
		let query = 'SELECT username as author, created, id, isedited, message, parent_id as parent, thread_id as thread ' +
			'FROM posts ' +
			'WHERE thread_id = ${thread.id} ';

		if (params.desc && params.desc === 'true') {
			if (params.since) {
				query += 'AND id < ${params.since} ';
			}

			query += 'ORDER BY created DESC, id DESC ';
		} else {
			if (params.since) {
				query += 'AND id > ${params.since} ';
			}

			query += 'ORDER BY created, id ';
		}

		if (params.limit) {
			query += 'LIMIT ${params.limit}';
		}

		return await db.manyOrNone(query, {thread: thread, params: params});
	}

	static async getPostsTree(thread, params) {
		let query = 'WITH RECURSIVE recursia AS ( ' +
			'SELECT username as author, created, id, isedited, message, parent_id as parent, thread_id as thread, ARRAY [id] as path ' +
			'FROM posts ' +
			'WHERE parent_id IS NULL AND thread_id = ${thread.id} ' +
			'UNION ' +
			'SELECT posts.username as author, posts.created, posts.id, posts.isedited, posts.message, posts.parent_id as parent, ' +
			'posts.thread_id as thread, array_append(recursia.path, posts.id) as path ' +
			'FROM posts ' +
			'JOIN recursia ' +
			'ON posts.parent_id = recursia.id ' +
			') ' +
			'SELECT recursia.id, recursia.message, recursia.created, recursia.parent, recursia.thread, recursia.author ' +
			'FROM recursia ';

		if (params.desc && params.desc === 'true') {
			if (params.since) {
				query += 'WHERE recursia.path  < (SELECT path FROM recursia WHERE id = ${since}) ';
			}
			query += 'ORDER BY recursia.path DESC ';
		} else {
			if (params.since) {
				query += 'WHERE recursia.path  > (SELECT path FROM recursia WHERE id = ${since}) ';
			}

			query += 'ORDER BY recursia.path ';
		}


		if (params.limit) {
			query += 'LIMIT ${params.limit}';
		}

		return await db.manyOrNone(query, {thread: thread, params: params, since: +params.since});
	}

	static async getPostsParentTree(thread, params) {
		const limit = +params.limit || 10000;

		let query = 'WITH RECURSIVE recursia AS ( ' +
			'    SELECT username as author, created, id, isedited, message, parent_id as parent, ' +
			'           thread_id as thread, ARRAY [id] as path, ' +
			'           dense_rank() over (ORDER BY id ' + (params.desc === 'true' ? ' DESC ' : '') + ' ) as rank ' +
			'    FROM posts ' +
			'    WHERE parent_id IS NULL AND thread_id = ${thread.id} ' +
			'    UNION ' +
			'    SELECT posts.username as author, posts.created, posts.id, posts.isedited, posts.message, ' +
			'           posts.parent_id as parent, posts.thread_id as thread, array_append(recursia.path, posts.id) as path, ' +
			'           recursia.rank ' +
			'    FROM posts ' +
			'    JOIN recursia ON posts.parent_id = recursia.id ' +
			') ' +
			'SELECT recursia.id, recursia.message, recursia.created, recursia.parent, recursia.thread, recursia.author, recursia.rank, recursia.path ' +
			'FROM recursia ';

		if (params.since) {
			query += 'JOIN recursia r ON r.id = ${since} ' +
				'WHERE recursia.rank <= ${limit} + r.rank ' +
				'AND (recursia.rank > r.rank OR recursia.rank = r.rank AND recursia.path > r.path) ' +
				'ORDER BY recursia.path[1]' + (params.desc === 'true' ? ' DESC ' : '') + ', array_remove(recursia.path, recursia.path[1])';
		} else {
			query += 'WHERE recursia.rank <= ${limit} ' +
				'ORDER BY recursia.path[1] '  + (params.desc === 'true' ? ' DESC ' : '') + ', array_remove(recursia.path, recursia.path[1])';
		}

		console.log(query);

		return await db.manyOrNone(query, {thread: thread, desc: params.desc, limit: limit, since: +params.since});
	}
}

module.exports = threadsModel;