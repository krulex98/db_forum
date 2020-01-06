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

	static async createThread(req, res) {
		const forumSlug = req.params.slug;
		const thread = {
			slug: null,
			created: null,
			...req.body,
		};

		try {
			const savedThread = await model.createThread(forumSlug, thread);
			res.status(201).json(savedThread);
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

	static async getDetails(req, res) {
		const forumSlug = req.params.slug;

		try {
			const details = await model.getDetails(forumSlug);
			res.status(200).json(details);
		} catch (error) {
			if (error instanceof errors.NotFoundError) {
				res.status(404).json({message: error.message});
				return;
			}

			res.status(500).json({ error: error});
		}
	}
}

module.exports = forumController;

