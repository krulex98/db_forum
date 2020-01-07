const pgp = require('pg-promise');
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
		return savedPosts;

	}
}

module.exports = threadsModel;