const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'doctor'],
      default: 'user',
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isDoctor: {
      type: Boolean,
      default: false,
    },
    unseenNotifications: {
      type: Array,
      default: [],
    },
    seenNotifications: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;


