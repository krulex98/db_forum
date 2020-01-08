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


}

module.exports = threadsModel;