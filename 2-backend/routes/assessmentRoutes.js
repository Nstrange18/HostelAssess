const router = require('express').Router();
const controller = require('../controllers/assessmentController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const validate = require('../middleware/validate');
const { createAssessmentSchema } = require('../validators/assessmentSchemas');

router.use(protect);
router.get('/me/current', controller.getCurrentAssessment);
router.get('/me', controller.getMyAssessments);
router.post('/', validate(createAssessmentSchema), controller.createAssessment);
router.get('/', requireAdmin, controller.getAssessments);

module.exports = router;
