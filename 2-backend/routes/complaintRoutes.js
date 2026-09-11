const router = require('express').Router();
const controller = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const validate = require('../middleware/validate');
const { createComplaintSchema, updateComplaintStatusSchema } = require('../validators/complaintSchemas');

router.use(protect);
router.get('/me', controller.getMyComplaints);
router.post('/', validate(createComplaintSchema), controller.createComplaint);
router.get('/', requireAdmin, controller.getComplaints);
router.patch('/:id/status', requireAdmin, validate(updateComplaintStatusSchema), controller.updateComplaintStatus);

module.exports = router;
