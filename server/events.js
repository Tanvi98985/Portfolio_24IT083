import { EventEmitter } from 'events';

/**
 * TaskEvents custom EventEmitter
 * Manages domain events for task lifecycle (task-created, task-deleted, error).
 */
class TaskEvents extends EventEmitter {}

// Singleton instance used across the backend
const taskEvents = new TaskEvents();

export default taskEvents;
export { taskEvents };
