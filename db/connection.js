const pgp = require('pg-promise');

const connection = {
	host: '127.0.0.1',
	port: 5432,
	database: 'forum',
	user: 'krulex',
	password: 'admin123'
};

const db = pgp({})(connection);
module.exports = db;