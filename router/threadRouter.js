const controller = require('../controllers/threadController');
const express = require('express');

const router = express.Router();

router.post('/:slug_or_id/create', controller.createPost);

module.exports = router;
