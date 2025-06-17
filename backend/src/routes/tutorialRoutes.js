const express = require('express');
const router = express.Router();
const tutorialController = require('../controllers/tutorialController');
const { authenticate, isAdmin } = require('../middlewares/auth');
const { uploadTutorialImage } = require('../middlewares/upload');

// Public routes
router.get('/', tutorialController.getAllTutorials);
router.get('/:id', tutorialController.getTutorialById);

// Admin routes
router.post('/', authenticate, isAdmin, uploadTutorialImage.single('image'), tutorialController.createTutorial);
router.put('/:id', authenticate, isAdmin, uploadTutorialImage.single('image'), tutorialController.updateTutorial);
router.delete('/:id', authenticate, isAdmin, tutorialController.deleteTutorial);

module.exports = router; 