const controller  = require('../controllers/forumController');
const express = require('express');

const router = express.Router();

router.post('/create', controller.createForum);
router.post('/:slug/create', controller.createThread);

module.exports = router;