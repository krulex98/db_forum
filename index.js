const express = require('express');
const morgan = require('morgan');
const app = express();

app.use(morgan('dev'));

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const userRouter = require('./router/userRouter');
app.use('/api/user', userRouter);

const forumRouter = require('./router/forumRouter');
app.use('/api/forum', forumRouter);

const threadRouter = require('./router/threadRouter');
app.use('/api/thread', threadRouter);

app.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});

//  TODO linter EsLint

//  TODO require -> import, alias for paths