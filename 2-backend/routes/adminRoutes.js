const router = require('express').Router(); const controller = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware'); const { requireInstitutionAdmin } = require('../middleware/adminMiddleware'); const validate = require('../middleware/validate'); const s = require('../validators/adminSchemas');
router.get('/invites/:token', validate(s.tokenSchema), controller.getInvite); router.post('/invites/accept', validate(s.acceptInviteSchema), controller.accept);
router.use(protect, requireInstitutionAdmin); router.get('/', controller.list); router.post('/invites', validate(s.inviteAdminSchema), controller.createInvite); router.delete('/invites/:id', validate(s.inviteIdSchema), controller.revokeInvite); router.patch('/:id/scope', validate(s.adminScopeSchema), controller.scope); router.patch('/:id/status', validate(s.adminStatusSchema), controller.status);
module.exports = router;
