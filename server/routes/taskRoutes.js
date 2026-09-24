import express from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import authMiddleware from '../middleware/auth.js';
import { validateTask } from '../middleware/validate.js';
import cache, { cacheStats } from '../cache.js';

const router = express.Router();

// Helper to check valid MongoDB ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Apply JWT authentication to ALL task routes
router.use(authMiddleware);

/**
 * @route   GET /tasks/cache/stats
 * @desc    Debug endpoint returning in-memory cache hit and miss statistics
 * @access  Protected (JWT)
 */
router.get('/cache/stats', (req, res) => {
  return res.status(200).json({
    hits: cacheStats.hits,
    misses: cacheStats.misses,
  });
});

/**
 * @route   GET /tasks
 * @desc    Get all tasks for the authenticated user (or general tasks), sorted by newest first
 *          Uses user-specific in-memory caching with a 60-second TTL
 */
router.get('/', async (req, res, next) => {
  try {
    const cacheKey = `all_tasks_${req.user.id}`;
    const cachedTasks = cache.get(cacheKey);

    if (cachedTasks) {
      cacheStats.hits++;
      console.log('\n========================================');
      console.log(`[CACHE HIT] ${cacheKey}`);
      console.log('========================================\n');
      return res.status(200).json(cachedTasks);
    }

    cacheStats.misses++;
    console.log('\n========================================');
    console.log(`[CACHE MISS] ${cacheKey}`);
    console.log('========================================\n');

    // Return tasks (matching user or existing unassigned tasks)
    const query = {
      $or: [
        { user: req.user.id },
        { user: { $exists: false } },
        { user: null },
      ],
    };
    const tasks = await Task.find(query).sort({ createdAt: -1 });

    // Store query result in cache (standard TTL 60 seconds)
    cache.set(cacheKey, tasks);

    return res.status(200).json(tasks);
  } catch (error) {
    return next(error);
  }
});

/**
 * @route   GET /tasks/:id
 * @desc    Get a single task by ID with user-specific in-memory caching
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid task ID format.' });
    }

    const cacheKey = `task_${req.user.id}_${id}`;
    const cachedTask = cache.get(cacheKey);

    if (cachedTask) {
      cacheStats.hits++;
      console.log('\n========================================');
      console.log(`[CACHE HIT] ${cacheKey}`);
      console.log('========================================\n');
      return res.status(200).json(cachedTask);
    }

    cacheStats.misses++;
    console.log('\n========================================');
    console.log(`[CACHE MISS] ${cacheKey}`);
    console.log('========================================\n');

    const query = {
      _id: id,
      $or: [
        { user: req.user.id },
        { user: { $exists: false } },
        { user: null },
      ],
    };
    const task = await Task.findOne(query);

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Store in cache
    cache.set(cacheKey, task);

    return res.status(200).json(task);
  } catch (error) {
    return next(error);
  }
});

/**
 * @route   POST /tasks
 * @desc    Create a new task for the authenticated user and invalidate user's all-tasks cache
 */
router.post('/', validateTask, async (req, res, next) => {
  try {
    const { title, description, completed } = req.body;

    const newTask = new Task({
      title: title.trim(),
      description: description ? description.trim() : '',
      completed: typeof completed === 'boolean' ? completed : false,
      user: req.user.id,
    });

    const savedTask = await newTask.save();

    // Invalidate user's all-tasks cache after successful write
    const allTasksKey = `all_tasks_${req.user.id}`;
    cache.del(allTasksKey);
    console.log('\n========================================');
    console.log(`[CACHE INVALIDATED] ${allTasksKey}`);
    console.log('========================================\n');

    return res.status(201).json(savedTask);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
});

/**
 * @route   PUT /tasks/:id
 * @desc    Update a task and invalidate user's all-tasks cache and single-task cache
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid task ID format.' });
    }

    const updates = {};
    if (req.body.title !== undefined) {
      if (typeof req.body.title !== 'string' || req.body.title.trim() === '') {
        return res.status(400).json({ error: 'Title cannot be empty.' });
      }
      updates.title = req.body.title.trim();
    }
    if (req.body.description !== undefined) {
      updates.description = req.body.description.trim();
    }
    if (req.body.completed !== undefined) {
      updates.completed = Boolean(req.body.completed);
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Invalidate cache after successful DB update
    const allTasksKey = `all_tasks_${req.user.id}`;
    const singleTaskKey = `task_${req.user.id}_${id}`;
    cache.del(allTasksKey);
    cache.del(singleTaskKey);
    console.log('\n========================================');
    console.log(`[CACHE INVALIDATED] ${allTasksKey}`);
    console.log(`[CACHE INVALIDATED] ${singleTaskKey}`);
    console.log('========================================\n');

    return res.status(200).json(updatedTask);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
});

/**
 * @route   DELETE /tasks/:id
 * @desc    Delete a task and invalidate user's all-tasks cache and single-task cache
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid task ID format.' });
    }

    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Invalidate cache after successful DB deletion
    const allTasksKey = `all_tasks_${req.user.id}`;
    const singleTaskKey = `task_${req.user.id}_${id}`;
    cache.del(allTasksKey);
    cache.del(singleTaskKey);
    console.log('\n========================================');
    console.log(`[CACHE INVALIDATED] ${allTasksKey}`);
    console.log(`[CACHE INVALIDATED] ${singleTaskKey}`);
    console.log('========================================\n');

    return res.status(200).json({
      message: 'Task deleted successfully.',
      id: deletedTask._id,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
