class BaseError extends Error {
	constructor (message) {
		super();
		Error.captureStackTrace( this, this.constructor );
		this.name = this.constructor.name;
		if (message) {
			this.message = message;
		}
	}
}

class AlreadyExistsError extends BaseError {
	constructor(data = {}) {
		super('Already exists.');
		this.data = data;
	}
}

class NotFoundError extends BaseError {
	constructor(message = 'Not Found Error.') {
		super(message);
	}
}

exports.AlreadyExistsError = AlreadyExistsError;
exports.NotFoundError = NotFoundError;