const express = require('express');
const router = express.Router();
const UserController = require('../../controllers/user');
const auth = require('../../middleware/auth');

router.post('/signup', UserController.signup);

router.post('/login', UserController.login);

router.get('/logout', auth, UserController.logout);

router.get('/current', auth, UserController.getCurrentUser);

module.exports = router;
