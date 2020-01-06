const controller  = require('../controllers/forumController');
const express = require('express');

const router = express.Router();

router.post('/create', controller.createForum);
router.post('/:slug/create', controller.createThread);
router.get('/:slug/details', controller.getDetails);

module.exports = router;