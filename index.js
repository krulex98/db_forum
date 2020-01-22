const express = require('express');
const cluster = require('express-cluster');
const morgan = require('morgan');

cluster(function(worker) {
	const app = express();

	app.use(morgan('dev'));

	app.use((req, res, next) => {
		const startAt = Date.now();
		next();
		console.log(req.url, `${((+Date.now() - +startAt)/ 1000).toFixed(3)}s`);
	});

	const bodyParser = require('body-parser');
	app.use(bodyParser.json());

	const userRouter = require('./router/userRouter');
	app.use('/api/user', userRouter);

	const forumRouter = require('./router/forumRouter');
	app.use('/api/forum', forumRouter);

	const threadRouter = require('./router/threadRouter');
	app.use('/api/thread', threadRouter);

	const postRouter = require('./router/postRouter');
	app.use('/api/post', postRouter);

	const serviceRouter = require('./router/serviceRouter');
	app.use('/api/service', serviceRouter);

	const port = 5000;
	return app.listen(port, function () {
		console.log(`Example app listening on port ${port} with worker ${worker.id}`);
	});
});