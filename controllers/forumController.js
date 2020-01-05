const model = require('../models/forumsModel');
const errors = require('../errors/errors');

class forumController {
	static async createForum(req, res) {
		try {
			const forum = await model.createForum(req.body);
			res.status(201).json(forum);
		} catch (error) {
			if (error instanceof errors.NotFoundError) {
				res.status(404).json({message: error.message});
				return;
			}
			if (error instanceof errors.AlreadyExistsError) {
				res.status(409).json(error.data);
				return;
			}
			res.status(500).json({ error: error});
		}
	}
}

module.exports = forumController;

