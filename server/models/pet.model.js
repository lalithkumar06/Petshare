const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['dog', 'cat', 'bird', 'other'],
  },
  breed: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    // imageUrl may be empty when image is stored privately in S3 and accessed via presigned URLs
    // or when an image was removed. Not strictly required at DB level.
  },
  // S3 object key (if uploaded to S3). Optional - used to generate presigned URLs when bucket objects are private.
  imageKey: {
    type: String,
  },
  status: {
    type: String,
    enum: ['available', 'pending', 'adopted'],
    default: 'available',
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Pet', petSchema);