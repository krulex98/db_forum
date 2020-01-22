const pgp = require('pg-promise');

let connection;

if (process.env.NODE_ENV === 'dev') {
	connection = {
		host: '127.0.0.1',
		port: 5432,
		database: 'forum',
		user: 'krulex',
		password: 'admin123'
	};
} else {
	connection = {
		host: '127.0.0.1',
		port: 5432,
		database: 'docker',
		user: 'docker',
		password: 'docker'
	};
}

console.log(connection);
const db = pgp({})(connection);
module.exports = db;