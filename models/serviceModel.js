const db = require('../db/connection');

class serviceModel {
	static async status() {
		const status = await db.one('SELECT ' +
			'(SELECT COUNT(*) FROM forums) as forum, ' +
			'(SELECT COUNT(*) FROM threads) as thread, ' +
			'(SELECT COUNT(*) FROM posts) as post, ' +
			'(SELECT COUNT(*) FROM users) as user');

		return {
			forum: +status.forum,
			thread: +status.thread,
			post: +status.post,
			user: +status.user
		};
	}

	static async clear() {
		return await db.any('TRUNCATE posts, threads, forums, users');
	}
}

const getCounterByName = (items, name) => {
	const item = items.find(item => item.relname === name);
	if (item) {
		return +item.n_live_tup;
	}
	return null;
};

module.exports = serviceModel;