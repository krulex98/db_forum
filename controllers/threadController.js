const model = require('../models/threadsModel');
const errors = require('../errors/errors');

class threadController {
	static async createPost(req, res) {
		const slugOrId = req.params.slug_or_id;
		const posts = req.body.map(post => {
			return {
				created: null,
				parent: null,
				...post
			};
		});

		try {
			const savedPosts = await model.createPost(slugOrId, posts);
			res.status(201).json(savedPosts);
		} catch (error) {
			if (error instanceof errors.NotFoundError) {
				res.status(404).json({message: error.message});
				return;
			}
			if (error instanceof errors.AlreadyExistsError) {
				res.status(409).json({message: error.message});
				return;
			}
			res.status(500).json({ error: error});
		}
	}
}

module.exports = threadController;