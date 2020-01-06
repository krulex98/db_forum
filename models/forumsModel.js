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

			const forums = await db.many('SELECT slug, posts, threads, title, username as user FROM forums WHERE slug = ${forum.slug}',
				{forum: forum});
			throw new errors.AlreadyExistsError(forums);
		}
	}
}

module.exports = forumsModel;