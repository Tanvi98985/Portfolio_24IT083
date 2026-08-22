import mongoose from 'mongoose';

/**
 * User Mongoose Model
 * Stored in the 'users' collection inside the unified 'tanvi_projects' database.
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
  },
  {
    timestamps: true,
  }
);

// Explicitly bind to 'users' collection in tanvi_projects database
const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');

export default User;
