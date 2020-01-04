const express = require('express');
const morgan = require('morgan');
const app = express();

app.use(morgan('dev'));

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const userRouter = require('./router/userRouter');
app.use('/api/user', userRouter);

app.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});

//  TODO linter EsLint

//  TODO alias for paths