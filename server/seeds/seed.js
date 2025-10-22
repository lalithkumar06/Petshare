const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/user.model');
const Pet = require('../models/pet.model');

dotenv.config();

const users = [
  {
    username: 'admin',
    email: 'admin@petshare.com',
    password: 'admin123',
    role: 'admin',
  },
  {
    username: 'john_doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'user',
  },
];

const pets = [
  {
    name: 'Max',
    type: 'dog',
    breed: 'Golden Retriever',
    age: 2,
    description: 'Friendly and energetic Golden Retriever looking for a loving home.',
    imageUrl: 'https://images.unsplash.com/photo-1507149833265-60c372daea22?auto=format&fit=crop&w=800&q=60',
    status: 'available',
  },
  {
    name: 'Luna',
    type: 'cat',
    breed: 'Persian',
    age: 1,
    description: 'Beautiful Persian cat who loves to cuddle.',
    imageUrl: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=800&q=60',
    status: 'available',
  },
  {
    name: 'Charlie',
    type: 'dog',
    breed: 'Beagle',
    age: 3,
    description: 'Playful Beagle who gets along well with children.',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=60',
    status: 'available',
  },
  {
    name: 'Bella',
    type: 'dog',
    breed: 'Labrador Retriever',
    age: 4,
    description: 'Loyal Labrador who loves to play fetch.',
    imageUrl: 'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?auto=format&fit=crop&w=800&q=60',
    status: 'available',
  },
  {
    name: 'Simba',
    type: 'cat',
    breed: 'Siamese',
    age: 2,
    description: 'Curious Siamese cat with blue eyes.',
    imageUrl: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=800&q=60',
    status: 'available',
  },
  {
    name: 'Coco',
    type: 'bird',
    breed: 'Cockatiel',
    age: 1,
    description: 'Chirpy Cockatiel who loves to sing.',
    imageUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=60',
    status: 'available',
  },
  {
    name: 'Rocky',
    type: 'dog',
    breed: 'Boxer',
    age: 5,
    description: 'Energetic Boxer who loves kids.',
    imageUrl: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&w=600&q=80',
    status: 'available',
  },
  {
    name: 'Milo',
    type: 'cat',
    breed: 'Maine Coon',
    age: 3,
    description: 'Gentle giant Maine Coon cat.',
    imageUrl: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=800&q=60',
    status: 'available',
  },
  {
    name: 'Daisy',
    type: 'dog',
    breed: 'Poodle',
    age: 2,
    description: 'Smart and friendly Poodle.',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=60',
    status: 'available',
  },
  {
    name: 'Oliver',
    type: 'cat',
    breed: 'Bengal',
    age: 2,
    description: 'Active Bengal cat with beautiful spots.',
    imageUrl: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=800&q=60',
    status: 'available',
  },
  {
    name: 'Sunny',
    type: 'bird',
    breed: 'Sun Conure',
    age: 1,
    description: 'Colorful Sun Conure who loves attention.',
    imageUrl: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=800&q=60',
    status: 'available',
  },
  {
    name: 'Buddy',
    type: 'dog',
    breed: 'Corgi',
    age: 2,
    description: 'Playful Corgi with a big personality.',
    imageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=60',
    status: 'available',
  },
  {
    name: 'Misty',
    type: 'cat',
    breed: 'Russian Blue',
    age: 4,
    description: 'Calm Russian Blue cat.',
    imageUrl: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=800&q=60',
    status: 'available',
  },
  {
    name: 'Peanut',
    type: 'dog',
    breed: 'Dachshund',
    age: 3,
    description: 'Lively Dachshund who loves to dig.',
    imageUrl: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=800&q=60',
    status: 'available',
  },
  {
    name: 'Ruby',
    type: 'cat',
    breed: 'Ragdoll',
    age: 2,
    description: 'Affectionate Ragdoll cat.',
    imageUrl: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=800&q=60',
    status: 'available',
  },
  {
    name: 'Sky',
    type: 'bird',
    breed: 'Budgerigar',
    age: 1,
    description: 'Charming Budgie who loves to talk.',
    imageUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=60',
    status: 'available',
  },
  {
    name: 'Shadow',
    type: 'dog',
    breed: 'Siberian Husky',
    age: 4,
    description: 'Adventurous Husky with blue eyes.',
    imageUrl: 'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?auto=format&fit=crop&w=800&q=60',
    status: 'available',
  },
  {
    name: 'Pumpkin',
    type: 'cat',
    breed: 'Scottish Fold',
    age: 3,
    description: 'Cute Scottish Fold with folded ears.',
    imageUrl: 'https://images.pexels.com/photos/416160/pexels-photo-416160.jpeg?auto=compress&w=600&q=80',
    status: 'available',
  },
  {
    name: 'Kiwi',
    type: 'bird',
    breed: 'Lovebird',
    age: 2,
    description: 'Sweet Lovebird who enjoys company.',
    imageUrl: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=800&q=60',
    status: 'available',
  },
  {
    name: 'Buster',
    type: 'dog',
    breed: 'French Bulldog',
    age: 2,
    description: 'Charming French Bulldog with a playful spirit.',
    imageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=60',
    status: 'available',
  },
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Clear existing data
    await User.deleteMany({});
    await Pet.deleteMany({});

    // Create users
    const createdUsers = [];
    for (const userData of users) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const user = new User({
        ...userData,
        password: hashedPassword,
      });
      
      const savedUser = await user.save();
      createdUsers.push(savedUser);
    }

    // Create pets
    // Prepare optional S3 client if configured
    let s3 = null;
    const useS3 = !!(process.env.AWS_BUCKET_NAME && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    if (useS3) {
      try {
        const AWS = require('aws-sdk');
        s3 = new AWS.S3({ region: process.env.AWS_REGION });
      } catch (e) {
        console.warn('AWS SDK not available, skipping S3 uploads');
        s3 = null;
      }
    }

    // Helper to download image into buffer
    const downloadImageBuffer = (imageUrl) => new Promise((resolve, reject) => {
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

    // Names to seed to S3
    const toUploadNames = new Set(['Charlie','Daisy','Max','Milo','Oliver','Sunny','Sky']);

    for (const petData of pets) {
      // If S3 is configured and this pet is in the upload list, try to upload its image
      if (s3 && petData.imageUrl && toUploadNames.has(petData.name)) {
        try {
          const { buffer, contentType } = await downloadImageBuffer(petData.imageUrl);
          const path = require('path');
          const filename = path.basename(new URL(petData.imageUrl).pathname).replace(/[^a-zA-Z0-9._-]/g, '') || `${Date.now()}.jpg`;
          const key = `pets/${Date.now().toString()}-${filename}`;
          const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            // Only include ACL if explicitly configured (server respects S3_ACL)
            ...(process.env.S3_ACL ? { ACL: process.env.S3_ACL } : {}),
          };
          const uploadRes = await s3.upload(params).promise();
          // Save S3 key and URL in seed data
          petData.imageKey = key;
          petData.imageUrl = uploadRes.Location || `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
          console.log(`Uploaded seed image for ${petData.name} -> ${key}`);
        } catch (err) {
          console.error(`Failed uploading seed image for ${petData.name}:`, err.message || err);
        }
      }

      const pet = new Pet({
        ...petData,
        owner: createdUsers[0]._id, // Assign to admin user
      });
      await pet.save();
    }

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();