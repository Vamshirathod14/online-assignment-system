const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', studentController.register);
router.post('/login', studentController.login);
router.get('/profile', protect, authorize('student'), studentController.getProfile);
router.get('/', protect, authorize('admin'), studentController.getAllStudents);

module.exports = router;
