const pgp = require('pg-promise');
const db = require('../db/connection');
const errors = require('../errors/errors');

class forumsModel {
	static async createForum(forum) {
		try {
			await db.one(`SELECT * FROM users WHERE nickname = '${forum.user}'`);
			return await db.one('INSERT INTO forums(slug, title, username) ' +
				'VALUES(${forum.slug}, ${forum.title}, ${forum.user}) RETURNING slug, posts, threads, title, username as user', {forum: forum});
		} catch (error) {
			if (error instanceof pgp.errors.QueryResultError) {
				throw new errors.NotFoundError();
			}

			const forums = await db.one('SELECT slug, posts, threads, title, username as user FROM forums WHERE slug = ${forum.slug}',
				{forum: forum});
			throw new errors.AlreadyExistsError(forums);
		}
	}

	static async createThread(forumSlug, thread) {
		try {
			await db.one('SELECT * FROM forums WHERE slug = ${forumSlug}', {forumSlug: forumSlug});
			await db.one('SELECT * FROM users WHERE nickname = ${thread.author}', {thread: thread});

			return await db.one('INSERT INTO threads(username, forum_slug, slug, created, message, title) ' +
				'VALUES(${thread.author}, ${forumSlug}, ${thread.slug}, ${thread.created}, ${thread.message}, ${thread.title}) ' +
				'RETURNING username as author, created, forum_slug as forum, id, message, title, slug, votes',
				{forumSlug: forumSlug, thread: thread});

		} catch (error) {
			if (error instanceof pgp.errors.QueryResultError) {
				throw new errors.NotFoundError();
			}

			const threads = await db.many('SELECT username as author, created, forum_slug as forum, id, message, title, slug, votes ' +
				'FROM threads WHERE title = ${thread.title}', {thread: thread});
			throw new errors.AlreadyExistsError(threads);
		}
	}
}

module.exports = forumsModel;