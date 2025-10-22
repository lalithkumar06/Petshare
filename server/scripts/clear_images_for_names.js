/*
 This script unsets imageKey and imageUrl for the provided pet names (keeps the pet records).
 Usage: node scripts/clear_images_for_names.js
*/
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Pet = require('../models/pet.model');

dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const names = ['Charlie','Daisy','Sunny','Kiwi'];
  const pets = await Pet.find({ name: { $in: names } });
  if (!pets.length) {
    console.log('No pets found to clear images for');
    process.exit(0);
  }

  for (const pet of pets) {
    try {
      pet.imageKey = undefined;
      pet.imageUrl = '';
      await pet.save();
      console.log('Cleared image fields for', pet.name);
    } catch (err) {
      console.error('Failed clearing for', pet.name, err && err.message ? err.message : err);
    }
  }
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
