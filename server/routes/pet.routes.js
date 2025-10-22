const router = require('express').Router();
const Pet = require('../models/pet.model');
const auth = require('../middleware/auth.middleware');
const jwt = require('jsonwebtoken');
const upload = require('../config/s3.config');
// Try to load AWS for presigned URL generation (optional)
let AWS;
try { AWS = require('aws-sdk'); } catch (e) { AWS = null; }

const S3_BUCKET = process.env.AWS_BUCKET_NAME;
const PRESIGN_EXPIRY = parseInt(process.env.S3_PRESIGN_EXPIRY || '900', 10); // seconds

// Get all pets
router.get('/', async (req, res) => {
  try {
    // Optionally exclude the requesting user's own pets from the list by passing ?excludeMine=true
    const excludeMine = req.query.excludeMine === 'true';

    // Try to decode token if provided so we can know the requesting user for excludeMine
    if (req.header('Authorization')) {
      try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
      } catch (e) {
        // ignore invalid token for browse endpoint
      }
    }
    let query = {};
    if (excludeMine && req.user) {
      query = { owner: { $ne: req.user.id }, status: 'available' };
    } else {
      // default: return only available pets for browse
      query = { status: 'available' };
    }

    let pets = await Pet.find(query).populate('owner', 'username');

    // If using S3 with private objects, generate presigned URLs for each pet that has imageKey
    if (S3_BUCKET && AWS) {
      const s3 = new AWS.S3({ region: process.env.AWS_REGION });
      pets = pets.map((p) => {
        const obj = p.toObject ? p.toObject() : p;
        if (obj.imageKey) {
          try {
            obj.imageUrl = s3.getSignedUrl('getObject', { Bucket: S3_BUCKET, Key: obj.imageKey, Expires: PRESIGN_EXPIRY });
          } catch (err) {
            console.error('Error generating presigned URL for', obj.imageKey, err);
          }
        }
        return obj;
      });
    }

    res.json(pets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get pets owned by the current user
router.get('/mine', auth, async (req, res) => {
  try {
    // Exclude pets that have been adopted
    const myPets = await Pet.find({ owner: req.user.id, status: { $ne: 'adopted' } }).populate('owner', 'username email');
    res.json(myPets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single pet with owner details
router.get('/:id', async (req, res) => {
  try {
    let pet = await Pet.findById(req.params.id).populate('owner', 'username email');
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    if (S3_BUCKET && AWS && pet.imageKey) {
      try {
        const s3 = new AWS.S3({ region: process.env.AWS_REGION });
        const signed = s3.getSignedUrl('getObject', { Bucket: S3_BUCKET, Key: pet.imageKey, Expires: PRESIGN_EXPIRY });
        const obj = pet.toObject ? pet.toObject() : pet;
        obj.imageUrl = signed;
        return res.json(obj);
      } catch (err) {
        console.error('Error generating presigned URL:', err);
      }
    }

    res.json(pet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// (moved above)

// Create new pet
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, type, breed, age, description } = req.body;

    // Validate required fields
    if (!name || !type || !breed || !age || !description) {
      return res.status(400).json({ message: 'Missing required fields: name, type, breed, age, description' });
    }

    // Ensure an image file was uploaded
    let imageUrl = '';
    let imageKey = '';
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required and must be an image (jpg/png/gif).' });
    }

    // multer-s3 provides .location and .key, disk storage provides .path
    imageUrl = req.file.location || (req.file.path ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : '');
    imageKey = req.file.key || req.file.filename || '';

    const pet = new Pet({
      name,
      type,
      breed,
      age,
      description,
      imageUrl,
      imageKey,
      owner: req.user.id,
    });

    await pet.save();
    let populated = await Pet.findById(pet._id).populate('owner', 'username email');

    // If using S3 and object key is present, generate a presigned URL for immediate access
    if (S3_BUCKET && AWS && populated.imageKey) {
      try {
        const s3 = new AWS.S3({ region: process.env.AWS_REGION });
        const signed = s3.getSignedUrl('getObject', { Bucket: S3_BUCKET, Key: populated.imageKey, Expires: PRESIGN_EXPIRY });
        const obj = populated.toObject ? populated.toObject() : populated;
        obj.imageUrl = signed;
        populated = obj;
      } catch (err) {
        console.error('Error generating presigned URL after upload:', err);
      }
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error('Error creating pet:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Update pet
router.patch('/:id', auth, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    if (pet.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(pet, req.body);
    await pet.save();
    res.json(pet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete pet
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('[DELETE /api/pets/:id] incoming user:', req.user && (req.user.id || req.user._id));
    const pet = await Pet.findById(req.params.id);
    
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Defensive checks and better logging for authorization failures
    const ownerId = pet.owner ? (pet.owner.toString ? pet.owner.toString() : pet.owner) : null;
    console.log('[DELETE] pet owner:', ownerId, 'requester:', req.user && req.user.id, 'requesterRole:', req.user && req.user.role);
    if (!ownerId) {
      console.warn('[DELETE] pet has no owner field set:', pet._id);
    }

    if (ownerId !== String(req.user.id) && req.user.role !== 'admin') {
      console.warn('[DELETE] authorization failed: owner mismatch');
      return res.status(403).json({ message: 'Not authorized to delete this pet' });
    }

    // Remove stored image from S3 if present
    try {
      if (pet.imageKey && S3_BUCKET && AWS) {
        const s3 = new AWS.S3({ region: process.env.AWS_REGION });
        await s3.deleteObject({ Bucket: S3_BUCKET, Key: pet.imageKey }).promise();
        console.log('Deleted S3 object for pet', pet._id, pet.imageKey);
      } else if (pet.imageUrl && pet.imageUrl.includes('/uploads/')) {
        // local disk storage: unlink the file
        const fs = require('fs');
        const path = require('path');
        try {
          const uploadsDir = path.join(__dirname, '..', 'uploads');
          const filename = pet.imageUrl.split('/uploads/').pop();
          const filePath = path.join(uploadsDir, filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Deleted local upload for pet', pet._id, filePath);
          }
        } catch (innerErr) {
          console.error('Failed deleting local upload for pet', pet._id, innerErr && innerErr.message ? innerErr.message : innerErr);
        }
      }
    } catch (err) {
      // Log and continue with deletion of DB record
      console.error('Error while deleting pet image for', pet._id, err && err.message ? err.message : err);
    }

    // Use deleteOne to remove the DB record (works whether `pet` is a document or plain object)
    await Pet.deleteOne({ _id: pet._id });
    console.log('[DELETE] removed pet document', pet._id);
    res.json({ message: 'Pet deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;