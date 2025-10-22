const router = require('express').Router();
const Notification = require('../models/notification.model');
const auth = require('../middleware/auth.middleware');

// Get notifications for current user
router.get('/', auth, async (req, res) => {
  try {
    const notes = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 })
      .populate({
        path: 'adoption',
        populate: [
          { path: 'pet', populate: { path: 'owner', select: 'username' } },
          { path: 'adopter', select: 'username' }
        ]
      });
    res.json(notes);
  } catch (err) {
    console.error('Error fetching notifications:', err && err.stack ? err.stack : err);
    res.status(500).json({ message: err.message || 'Server error while fetching notifications' });
  }
});

// Mark as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const note = await Notification.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Notification not found' });
    if (note.user.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    note.read = true;
    await note.save();
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
