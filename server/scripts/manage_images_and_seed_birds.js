/*
 Script to:
  - Remove images for specific pet names (Charlie, Daisy, Sunny, Kiwi)
  - Add several bird pets to the DB (and upload their images to S3 if configured)

 Usage: node scripts/manage_images_and_seed_birds.js
*/

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const Pet = require('../models/pet.model');
const User = require('../models/user.model');

const AWS = (() => {
  try { return require('aws-sdk'); } catch (e) { return null; }
})();

const S3_BUCKET = process.env.AWS_BUCKET_NAME;

async function connect() {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
}

async function removeImagesByName(names) {
  const pets = await Pet.find({ name: { $in: names } });
  if (!pets.length) {
    console.log('No pets found for names:', names);
    return;
  }

  for (const pet of pets) {
    try {
      if (pet.imageKey && S3_BUCKET && AWS) {
        const s3 = new AWS.S3({ region: process.env.AWS_REGION });
        await s3.deleteObject({ Bucket: S3_BUCKET, Key: pet.imageKey }).promise();
        console.log(`Deleted S3 image for ${pet.name} -> ${pet.imageKey}`);
      } else if (pet.imageUrl && pet.imageUrl.includes('/uploads/')) {
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        const filename = pet.imageUrl.split('/uploads/').pop();
        const filePath = path.join(uploadsDir, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted local file for ${pet.name} -> ${filePath}`);
        }
      } else {
        console.log(`No managed image found for ${pet.name}, skipping image deletion.`);
      }

      // Clear imageKey/imageUrl on DB record (but keep the pet entry)
      pet.imageKey = undefined;
      pet.imageUrl = '';
      await pet.save();
      console.log(`Cleared image fields for ${pet.name}`);
    } catch (err) {
      console.error('Error while removing image for', pet.name, err && err.message ? err.message : err);
    }
  }
}

// Helper to upload a remote image URL to S3 (returns { key, location })
const downloadBuffer = (imageUrl) => new Promise((resolve, reject) => {
  try {
    const url = require('url');
    const parsed = url.parse(imageUrl);
    const protocol = parsed.protocol === 'https:' ? require('https') : require('http');
    protocol.get(imageUrl, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`Failed to download image, status ${res.statusCode}`));
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentType = res.headers['content-type'] || 'application/octet-stream';
        resolve({ buffer, contentType });
      });
    }).on('error', reject);
  } catch (err) { reject(err); }
});

async function uploadToS3(buffer, contentType, filename) {
  if (!AWS || !S3_BUCKET) throw new Error('S3 not configured');
  const s3 = new AWS.S3({ region: process.env.AWS_REGION });
  const key = `pets/${Date.now().toString()}-${filename}`;
  const params = {
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ...(process.env.S3_ACL ? { ACL: process.env.S3_ACL } : {}),
  };
  const res = await s3.upload(params).promise();
  return { key, location: res.Location || `https://${S3_BUCKET}.s3.amazonaws.com/${key}` };
}

async function seedBirds() {
  // Ensure we have a user to own the created birds (use admin user if present)
  let owner = await User.findOne({ role: 'admin' });
  if (!owner) {
    owner = await User.findOne();
    if (!owner) throw new Error('No users found in DB to assign as owner. Please create a user first.');
  }

  const birds = [
    {
      name: 'Kiwi-B',
      type: 'bird',
      breed: 'Budgerigar',
      age: 1,
      description: 'Cheerful budgie that loves to chatter.',
      imageUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=60',
    },
    {
      name: 'Pico',
      type: 'bird',
      breed: 'Parakeet',
      age: 2,
      description: 'Playful parakeet, enjoys company.',
      imageUrl: 'https://images.unsplash.com/photo-1535914254981-b5012eebbd15?auto=format&fit=crop&w=800&q=60',
    },
    {
      name: 'Iggy',
      type: 'bird',
      breed: 'Lovebird',
      age: 1,
      description: 'Sweet lovebird, very affectionate.',
      imageUrl: 'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?auto=format&fit=crop&w=800&q=60',
    },
  ];

  for (const b of birds) {
    try {
      let imageKey;
      let imageUrl = b.imageUrl;
      if (AWS && S3_BUCKET) {
        try {
          const { buffer, contentType } = await downloadBuffer(b.imageUrl);
          const filename = path.basename(new URL(b.imageUrl).pathname).replace(/[^a-zA-Z0-9._-]/g, '') || `${Date.now()}.jpg`;
          const up = await uploadToS3(buffer, contentType, filename);
          imageKey = up.key;
          imageUrl = up.location;
          console.log(`Uploaded bird image to S3 for ${b.name} -> ${up.key}`);
        } catch (err) {
          console.error('Failed to upload bird image to S3 for', b.name, err && err.message ? err.message : err);
        }
      }

      const pet = new Pet({
        name: b.name,
        type: b.type,
        breed: b.breed,
        age: b.age,
        description: b.description,
        imageUrl,
        imageKey,
        owner: owner._id,
      });
      await pet.save();
      console.log('Created bird pet', b.name);
    } catch (err) {
      console.error('Failed creating bird pet', b.name, err && err.message ? err.message : err);
    }
  }
}

async function main() {
  try {
    await connect();
    // Names to delete images for (explicit: Charlie, Daisy, Sunny, Kiwi)
    await removeImagesByName(['Charlie', 'Daisy', 'Sunny', 'Kiwi']);
    // Seed birds
    await seedBirds();
    console.log('manage_images_and_seed_birds script completed');
    process.exit(0);
  } catch (err) {
    console.error('Script failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
