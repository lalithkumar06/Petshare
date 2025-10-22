/*
 Deletes pets by name (Charlie, Daisy, Sunny, Kiwi) including their images (S3 or local),
 then seeds a set of bird pets (uploads images to S3 if configured).

 Usage: node scripts/delete_and_seed_birds.js
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

async function deletePetsByName(names) {
  const pets = await Pet.find({ name: { $in: names } });
  if (!pets.length) {
    console.log('No pets found for deletion:', names);
    return;
  }

  for (const pet of pets) {
    try {
      if (pet.imageKey && S3_BUCKET && AWS) {
        const s3 = new AWS.S3({ region: process.env.AWS_REGION });
        await s3.deleteObject({ Bucket: S3_BUCKET, Key: pet.imageKey }).promise();
        console.log(`Deleted S3 object for ${pet.name} -> ${pet.imageKey}`);
      } else if (pet.imageUrl && pet.imageUrl.includes('/uploads/')) {
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        const filename = pet.imageUrl.split('/uploads/').pop();
        const filePath = path.join(uploadsDir, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted local file for ${pet.name} -> ${filePath}`);
        }
      }
    } catch (err) {
      console.error('Error deleting image for', pet.name, err && err.message ? err.message : err);
    }

    try {
      await Pet.deleteOne({ _id: pet._id });
      console.log('Deleted pet document for', pet.name);
    } catch (err) {
      console.error('Failed to delete pet doc for', pet.name, err && err.message ? err.message : err);
    }
  }
}

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
  let owner = await User.findOne({ role: 'admin' });
  if (!owner) owner = await User.findOne();
  if (!owner) throw new Error('No user found to assign as owner. Create a user first.');

  const birds = [
    {
      name: 'Bluebell',
      type: 'bird',
      breed: 'Canary',
      age: 1,
      description: 'Melodic canary that loves singing.',
      imageUrl: 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=800&q=60',
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
      name: 'Skye',
      type: 'bird',
      breed: 'Cockatiel',
      age: 1,
      description: 'Friendly cockatiel who whistles happily.',
      imageUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=60',
    },
    {
      name: 'Iggy',
      type: 'bird',
      breed: 'Lovebird',
      age: 1,
      description: 'Affectionate lovebird, very social.',
      imageUrl: 'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?auto=format&fit=crop&w=800&q=60',
    },
  ];

  for (const b of birds) {
    try {
      // remove existing same-name pet to avoid duplicates
      await Pet.deleteMany({ name: b.name });

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

    // Delete specified pets fully
    await deletePetsByName(['Charlie','Daisy','Sunny','Kiwi']);

    // Seed replacement bird data
    await seedBirds();

    console.log('delete_and_seed_birds script completed');
    process.exit(0);
  } catch (err) {
    console.error('Script failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
