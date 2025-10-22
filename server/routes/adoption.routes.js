const router = require('express').Router();
const Adoption = require('../models/adoption.model');
const Pet = require('../models/pet.model');
const Notification = require('../models/notification.model');
const auth = require('../middleware/auth.middleware');

// Get all adoption requests
router.get('/', auth, async (req, res) => {
  try {
    const adoptions = await Adoption.find()
      .populate('pet')
      .populate('adopter', 'username email');
    res.json(adoptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create adoption request
router.post('/', auth, async (req, res) => {
  try {
    const { petId } = req.body;
    
    // Check if pet exists and is available
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }
    if (pet.status !== 'available') {
      return res.status(400).json({ message: 'Pet is not available for adoption' });
    }

    // Check if user already has a pending request for this pet
    const existingRequest = await Adoption.findOne({
      pet: petId,
      adopter: req.user.id,
      status: 'pending',
    });
    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending request for this pet' });
    }

    const adoption = new Adoption({
      pet: petId,
      adopter: req.user.id,
    });

    // Update pet status
    pet.status = 'pending';
    await pet.save();

    await adoption.save();
    // Create a notification for the pet owner
    try {
      await Notification.create({
        user: pet.owner,
        message: `New adoption request for your pet ${pet.name}`,
        link: `/pets/${pet._id}`,
        adoption: adoption._id,
      });
    } catch (nErr) {
      console.error('Failed to create notification:', nErr);
    }

    res.status(201).json(adoption);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update adoption request status
router.patch('/:id', auth, async (req, res) => {
  try {
    const adoption = await Adoption.findById(req.params.id);
    if (!adoption) {
      return res.status(404).json({ message: 'Adoption request not found' });
    }

    const pet = await Pet.findById(adoption.pet);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Only pet owner or admin can update adoption status
    if (pet.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    adoption.status = req.body.status;
    if (req.body.status === 'approved') {
      adoption.approvalDate = Date.now();
      pet.status = 'adopted';
      await pet.save();
    } else if (req.body.status === 'rejected') {
      pet.status = 'available';
      await pet.save();
    }

    await adoption.save();
    // Notify adopter if approved or rejected
    try {
      if (adoption.adopter) {
        await Notification.create({
          user: adoption.adopter,
          message: req.body.status === 'approved'
            ? `Your adoption request for pet ${pet.name} was approved.`
            : `Your adoption request for pet ${pet.name} was rejected.`,
          link: `/adoptions/${adoption._id}`,
          adoption: adoption._id,
        });
      }
    } catch (nErr) {
      console.error('Failed to create notification for adopter:', nErr);
    }

    res.json(adoption);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;