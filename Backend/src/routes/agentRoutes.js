const express = require('express');
const router = express.Router();
const {
  createAgent,
  getAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
  archiveAgent,
  restoreAgent,
} = require('../controllers/agentController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.route('/')
  .post(upload.single('profileImage'), createAgent)
  .get(getAgents);

router.route('/:id/archive').put(archiveAgent);
router.route('/:id/restore').put(restoreAgent);

router.route('/:id')
  .get(getAgentById)
  .put(upload.single('profileImage'), updateAgent)
  .delete(deleteAgent);

module.exports = router;
