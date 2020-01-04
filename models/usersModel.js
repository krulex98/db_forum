const pgp = require('pg-promise');
const db = require('../db/connection');
const errors = require('../errors/errors');

class usersModel {
	static async createUser(nickname, profile) {
		try {
			return await db.manyOrNone('INSERT INTO users(nickname, email, fullname, about) ' +
				'VALUES(${nickname}, ${profile.email}, ${profile.fullname}, ${profile.about}) RETURNING *', {
				profile: profile, nickname: nickname
			});
		}
		catch (error) {
			const users = await db.manyOrNone(`select * from users where nickname = '${nickname}' or email = '${profile.email}'`);
			throw new errors.AlreadyExistsError(users);
			// TODO error
		}
	}

	static async getProfile(nickname) {
		try {
			return await db.one(`SELECT * FROM users WHERE nickname = '${nickname}'`);
		}
		catch(error) {
			throw new errors.NotFoundError();
		}
	}

	static async updateProfile(nickname, profile) {
		try {
			return await db.one('UPDATE users SET about = ${profile.about}, email = ${profile.email}, fullname = ${profile.fullname} ' +
				'WHERE nickname = ${nickname} RETURNING *',{
				profile: profile, nickname: nickname
			});
		}
		catch(error) {
			if (error instanceof pgp.errors.QueryResultError) {
				throw new errors.NotFoundError();
			}
			throw new errors.AlreadyExistsError();
		}
	}
}

module.exports = usersModel;