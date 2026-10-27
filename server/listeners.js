import taskEvents from './events.js';
import User from './models/User.js';

/**
 * Event handler for 'task-created'
 * Asynchronously simulates sending a notification (e.g. email/SMS)
 */
export const handleTaskCreated = async (task) => {
  try {
    console.log(`[Event] task-created handler STARTED at ${new Date().toISOString()}`);

    // If the title contains FAIL_NOTIFY, throw an error to test the error listener
    if (task && task.title && task.title.includes('FAIL_NOTIFY')) {
      throw new Error(`Simulated notification failure for task: "${task.title}"`);
    }

    // Configurable simulated notification delay (default 2000ms)
    const delay = Number(process.env.NOTIFICATION_DELAY_MS) || 2000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Look up assigned user's email from User collection
    let userEmail = 'Unassigned';
    if (task && task.user) {
      const userId = task.user._id || task.user;
      const user = await User.findById(userId);
      if (user && user.email) {
        userEmail = user.email;
      }
    }

    console.log(
      `[Notification] Task "${task.title}" created | user: ${userEmail} | time: ${new Date().toISOString()}`
    );
    console.log(`[Event] task-created handler COMPLETED at ${new Date().toISOString()}`);
  } catch (err) {
    // Forward error to taskEvents error listener so server never crashes
    taskEvents.emit('error', err);
  }
};

/**
 * Event handler for 'task-deleted'
 * Logs task deletion details with title, id, and timestamp
 */
export const handleTaskDeleted = (task) => {
  try {
    const taskId = task?._id || task?.id || 'unknown';
    const taskTitle = task?.title || 'Untitled';
    console.log(
      `[Event] Task deleted | id: ${taskId} | title: "${taskTitle}" | time: ${new Date().toISOString()}`
    );
  } catch (err) {
    taskEvents.emit('error', err);
  }
};

// Register event listeners
taskEvents.on('task-created', handleTaskCreated);
taskEvents.on('task-deleted', handleTaskDeleted);

// Error listener: catches forwarded errors so unhandled 'error' never crashes the Node.js process
taskEvents.on('error', (err) => {
  console.error(`[Event Error] ${err.message} at ${new Date().toISOString()}`);
});
