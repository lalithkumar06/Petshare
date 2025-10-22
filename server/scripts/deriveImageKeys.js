// Derive imageKey from existing imageUrl for pets whose images are in the configured S3 bucket
// Usage: node scripts/deriveImageKeys.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Pet = require('../models/pet.model');

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB');

  const S3_BUCKET = process.env.AWS_BUCKET_NAME;
  if (!S3_BUCKET) {
    console.error('AWS_BUCKET_NAME not set. Aborting.');
    process.exit(1);
  }

  const pets = await Pet.find({ $or: [{ imageKey: { $exists: false } }, { imageKey: '' }] });
  console.log(`Found ${pets.length} pets without imageKey`);

  let updated = 0;
  for (const pet of pets) {
    const url = pet.imageUrl || '';
    try {
      // Try to detect S3 object key from a few common URL forms
      // Examples:
      // https://my-bucket.s3.amazonaws.com/pets/12345-filename.jpg
      // https://s3.us-east-1.amazonaws.com/my-bucket/pets/12345-filename.jpg
      // https://my-bucket.s3.amazonaws.com/pets/12345-filename.jpg?X-Amz-Signature=...

      if (!url.includes(S3_BUCKET)) {
        continue; // skip non-S3 URLs
      }

      // Remove query string
      const clean = url.split('?')[0];

      // Find '/<bucket>/' and extract what comes after
      let key = '';
      const bucketIndex = clean.indexOf(S3_BUCKET);
      if (bucketIndex >= 0) {
        // find the substring after the bucket name
        const after = clean.substring(bucketIndex + S3_BUCKET.length);
        // strip leading slash
        key = after.replace(/^\//, '');
      }

      if (!key) {
        console.warn('Could not derive key for pet', pet._id, 'url', url);
        continue;
      }

      pet.imageKey = key;
      await pet.save();
      updated++;
      console.log('Updated pet', pet._id, 'imageKey=', key);
    } catch (err) {
      console.error('Error processing pet', pet._id, err.message || err);
    }
  }

  console.log(`Done. Updated ${updated} documents.`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Script error', err);
  process.exit(1);
});
