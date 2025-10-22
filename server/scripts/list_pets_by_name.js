const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Pet = require('../models/pet.model');

dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const names = ['Charlie','Daisy','Sunny','Kiwi','Bluebell','Pico','Skye','Iggy'];
  const pets = await Pet.find({ name: { $in: names } }).select('name imageUrl imageKey');
  console.log('Found pets:');
  pets.forEach(p => console.log(JSON.stringify(p, null, 2)));
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
