const router = require('express').Router();
const controller = require('../controllers/hostelController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const validate = require('../middleware/validate');
const { createHostelSchema, updateHostelSchema } = require('../validators/hostelSchemas');

router.get('/manage', protect, requireAdmin, controller.getHostels);
router.get('/', controller.getHostels);
router.post('/', protect, requireAdmin, validate(createHostelSchema), controller.createHostel);
router.patch('/:id', protect, requireAdmin, validate(updateHostelSchema), controller.updateHostel);

module.exports = router;
