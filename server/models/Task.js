import mongoose from 'mongoose';

/**
 * Task Mongoose Model
 * Stored in the 'tasks' collection inside the unified 'tanvi_projects' database.
 */
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Task title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Task description cannot exceed 1000 characters'],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Explicitly bind to 'tasks' collection to ensure clean separation from other practicals
const Task = mongoose.models.Task || mongoose.model('Task', taskSchema, 'tasks');

export default Task;
