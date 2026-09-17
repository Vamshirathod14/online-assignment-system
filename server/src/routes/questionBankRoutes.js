const express = require('express');
const router = express.Router();
const questionBankController = require('../controllers/questionBankController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('admin'), questionBankController.create);
router.get('/count', protect, authorize('admin'), questionBankController.getBankCount);
router.get('/', protect, questionBankController.getAll);
router.get('/:id', protect, questionBankController.getById);
router.put('/:id', protect, authorize('admin'), questionBankController.update);
router.delete('/:id', protect, authorize('admin'), questionBankController.delete);

module.exports = router;