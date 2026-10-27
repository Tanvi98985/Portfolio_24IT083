# Practical 10: Asynchronous Processing with Event-Driven Architecture

## 1. Objective
The objective of this practical is to implement **Asynchronous Event-Driven Architecture** in the full-stack Task Management application using Node.js's built-in `events` module (`EventEmitter`) without adding any external dependencies.

Specifically:
- Decouple time-consuming secondary tasks (such as sending notifications and audit logging) from the critical HTTP request-response cycle.
- Create a dedicated domain event emitter (`TaskEvents`) exporting a singleton instance.
- Implement background asynchronous listeners for `task-created` and `task-deleted` events.
- Simulate external notification delivery with a configurable delay (`NOTIFICATION_DELAY_MS`, default 2000 ms) and resolve user email metadata from MongoDB.
- Ensure bulletproof server resilience using a dedicated `error` event listener to prevent unhandled EventEmitter errors from crashing the Node.js process.
- Implement a demonstration mode (`?mode=sync`) to benchmark and compare synchronous blocking execution against asynchronous event-driven non-blocking execution.
- Maintain existing MongoDB Atlas integration, JWT authentication, data validation, and in-memory cache invalidation.

---

## 2. Problem Statement
In traditional synchronous REST API architectures, when an endpoint performs multiple responsibilities—such as saving a task to the database, dispatching confirmation emails/SMS notifications, and writing audit logs—each step executes sequentially:

```
Client Request ──> [DB Write] ──> [Send Email (2s)] ──> [Audit Log] ──> Client Response
                                   ▲
                    Client blocks waiting for 2+ seconds
```

If the notification service takes 2 seconds or encounters high network latency, the HTTP client remains stalled waiting for the HTTP response. Furthermore, if the notification service experiences a transient error, it risks failing the entire API call even though the task was already successfully stored in the database.

By adopting an **Event-Driven Architecture**, the API handler saves the task, sends the HTTP response immediately back to the client, and emits an internal event (`task-created`). The event listener then executes asynchronously in the background on the Node.js event loop without blocking the user.

---

## 3. Technologies Used
- **Node.js `events` Module**: Built-in Node.js `EventEmitter` class providing publish-subscribe messaging within the process.
- **Express 5**: Node.js web application framework routing HTTP requests.
- **MongoDB & Mongoose**: Object Data Modeling (ODM) library and NoSQL document database.
- **node-cache**: Server-side in-memory caching engine (from Practical 9).
- **JSON Web Token (JWT)**: Stateless token-based user authentication.
- **React (Vite)**: Frontend user interface (unchanged).

---

## 4. Architecture Diagram

The diagram below illustrates how client requests are processed asynchronously using Node's `EventEmitter`:

```
┌────────────────────────────────────────────────────────┐
│             Client (Postman / Browser App)             │
└───────────────────────────┬────────────────────────────┘
                            │
               HTTP POST /tasks (JWT Auth)
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          Express Route Handler (taskRoutes.js)         │
│  1. Validate request body                              │
│  2. Save Task to MongoDB Atlas / local DB              │
│  3. Invalidate user's in-memory cache                  │
│  4. Send HTTP 201 Response IMMEDIATELY ────────────────┼──> [Client receives 201 Created (~20ms)]
│  5. taskEvents.emit('task-created', savedTask)         │
└───────────────────────────┬────────────────────────────┘
                            │ (In-memory Event Emission)
                            ▼
┌────────────────────────────────────────────────────────┐
│          TaskEvents EventEmitter (events.js)           │
└───────────────────────────┬────────────────────────────┘
                            │ Dispatches to Registered Listeners
                            ▼
┌────────────────────────────────────────────────────────┐
│              Listeners (listeners.js)                  │
│                                                        │
│  [task-created Listener]                               │
│   ├── Log "[Event] task-created handler STARTED"       │
│   ├── Check for FAIL_NOTIFY simulation                 │
│   ├── Non-blocking setTimeout(NOTIFICATION_DELAY_MS)   │
│   ├── Fetch user email from User model via task.user   │
│   ├── Log "[Notification] Task created..."             │
│   └── Log "[Event] task-created handler COMPLETED"     │
│                                                        │
│  [error Listener]                                      │
│   └── Catches forwarded errors, logs [Event Error]     │
│       without crashing the Node.js process             │
└────────────────────────────────────────────────────────┘
```

---

## 5. Files Created and Modified

| File | Status | Description |
|---|---|---|
| `server/events.js` | **Created** | Defines `class TaskEvents extends EventEmitter {}` and exports a singleton instance (`taskEvents`). |
| `server/listeners.js` | **Created** | Registers event listeners for `task-created`, `task-deleted`, and `error`. Simulates delayed notifications, fetches user email from MongoDB, and safely handles errors. |
| `server/server.js` | **Modified** | Added `import './listeners.js'` once at startup before routes mount so listeners are registered before any requests arrive. |
| `server/routes/taskRoutes.js` | **Modified** | Updated `POST /tasks` to send response first, then emit `task-created` (with `?mode=sync` comparison support). Updated `DELETE /tasks/:id` to respond first, then emit `task-deleted`. |
| `.env.example` | **Modified** | Added `NOTIFICATION_DELAY_MS=2000` to document the notification delay parameter. |
| `server/db.js` | **Maintained** | Includes automatic local MongoDB fallback if remote Atlas SRV DNS is restricted by campus firewalls. |

---

## 6. Implementation Details

### 6.1 `server/events.js`
Subclasses Node's built-in `EventEmitter` and exports a singleton instance:
```javascript
import { EventEmitter } from 'events';

class TaskEvents extends EventEmitter {}

const taskEvents = new TaskEvents();

export default taskEvents;
export { taskEvents };
```

### 6.2 `server/listeners.js`
Contains listeners for task events and process safety:
- **`task-created`**:
  - Logs `[Event] task-created handler STARTED at <ISO>`.
  - Checks if title contains `FAIL_NOTIFY` to demonstrate error handling.
  - Awaits `NOTIFICATION_DELAY_MS` (default 2000ms).
  - Queries `User.findById(task.user)` to resolve the user's email address.
  - Logs `[Notification] Task "<title>" created | user: <email> | time: <ISO>`.
  - Logs `[Event] task-created handler COMPLETED at <ISO>`.
  - Any errors are caught and forwarded via `taskEvents.emit('error', err)`.
- **`task-deleted`**:
  - Logs `[Event] Task deleted | id: <id> | title: "<title>" | time: <ISO>`.
- **`error`**:
  - Logs `[Event Error] <message> at <ISO>`.
  - In Node.js, if an EventEmitter emits `'error'` and no listener is registered, Node throws an uncaught exception and terminates the process. Registering this listener guarantees the server stays online.

### 6.3 `server/routes/taskRoutes.js`
In `POST /tasks`:
```javascript
// Demo comparison: synchronous blocking notification if ?mode=sync
if (req.query.mode === 'sync') {
  await handleTaskCreated(savedTask);
  console.log(`[API] (SYNC) Response sent at ${new Date().toISOString()}`);
  return res.status(201).json(savedTask);
}

// Default asynchronous event-driven flow: respond to client first, then emit event
console.log(`[API] Response sent at ${new Date().toISOString()}`);
res.status(201).json(savedTask);
taskEvents.emit('task-created', savedTask);
```

In `DELETE /tasks/:id`:
```javascript
// Respond to client first, then emit event asynchronously
res.status(200).json({
  message: 'Task deleted successfully.',
  id: deletedTask._id,
});
taskEvents.emit('task-deleted', deletedTask);
```

---

## 7. Execution and Console Output Analysis

### Asynchronous Flow (`POST /tasks`)
When a task is created normally:
1. Express saves the task to MongoDB.
2. In-memory cache is invalidated: `[CACHE INVALIDATED] all_tasks_<userId>`.
3. Express logs `[API] Response sent at 2026-10-27T09:39:45.869Z` and delivers HTTP 201 to client.
4. `taskEvents.emit('task-created', savedTask)` triggers the listener.
5. Listener logs `[Event] task-created handler STARTED at 2026-10-27T09:39:45.871Z`.
6. Non-blocking 2000ms timeout elapses on the Node.js event loop.
7. Listener logs `[Notification] Task "Async Architecture Task" created | user: tanvi@example.com | time: 2026-10-27T09:39:47.879Z`.
8. Listener logs `[Event] task-created handler COMPLETED at 2026-10-27T09:39:47.879Z`.

**Key Observation**: The client receives HTTP 201 in **23 ms**! The 2000ms notification completed in the background without making the client wait.

### Synchronous Flow (`POST /tasks?mode=sync`)
When requested with `?mode=sync`:
1. Express saves the task to MongoDB and invalidates cache.
2. Route handler awaits `handleTaskCreated(savedTask)` before sending response.
3. Listener logs `[Event] task-created handler STARTED at 2026-10-27T09:39:48.894Z`.
4. Process waits 2000ms.
5. Listener logs `[Notification] Task "Sync Blocking Task" created | user: tanvi@example.com | time: 2026-10-27T09:39:50.914Z`.
6. Listener logs `[Event] task-created handler COMPLETED at 2026-10-27T09:39:50.914Z`.
7. Route handler finally logs `[API] (SYNC) Response sent at 2026-10-27T09:39:50.914Z` and returns response.

**Key Observation**: The client was stalled for **2028 ms**!

---

## 8. Sync vs Async Comparison Table

| Metric / Aspect | Synchronous Flow (`?mode=sync`) | Asynchronous Flow (Default Event-Driven) |
|---|---|---|
| **Client Response Time** | **~2,028 ms** | **~23 ms** (approx. 98.8% faster) |
| **API Response Timing** | `[API] Response sent` appears **AFTER** `[Event] COMPLETED` | `[API] Response sent` appears **BEFORE** `[Notification]` / `[Event] COMPLETED` |
| **Client Experience** | User experiences UI freeze / loading spinner for over 2 seconds | User experiences instantaneous task creation |
| **Coupling** | Route handler is tightly coupled to notification logic and delay | Route handler only produces an event; decoupled from consumers |
| **Impact of Notification Failure** | Can fail the entire HTTP request or delay the response | Handled independently by event error listener; user request succeeded |
| **Node.js Concurrency** | Blocks async request continuation for 2000ms | Yields event loop, server handles other concurrent HTTP requests freely |

---

## 9. Error Handling Demonstration (`FAIL_NOTIFY`)

To verify server stability when background operations fail:
1. Client sends `POST /tasks` with title `"Task with FAIL_NOTIFY error demo"`.
2. The task is saved to the database, cache is invalidated, and HTTP 201 is returned to the client immediately.
3. The `task-created` listener begins execution.
4. Detecting `"FAIL_NOTIFY"` in the title, it throws: `new Error('Simulated notification failure for task...')`.
5. The `catch` block catches the error and executes `taskEvents.emit('error', err)`.
6. The dedicated error listener intercepts the event:
   ```
   [Event Error] Simulated notification failure for task: "Task with FAIL_NOTIFY error demo" at 2026-10-27T09:39:50.924Z
   ```
7. **Result**: The server continues running without crashing. Subsequent requests to create, read, and delete tasks continue to succeed without interruption.

---

## 10. Postman / Thunder Client Testing Guide

### Prerequisites
1. Start the server:
   ```bash
   npm run server
   ```
2. Terminal shows:
   ```
   Server running on port 5000
   MongoDB connected successfully
   ```

### Step 1: Login to get JWT Token
- **Method**: `POST`
- **URL**: `http://localhost:5000/auth/login`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "email": "tanvi@example.com",
    "password": "password123"
  }
  ```
- **Response**: Copy the `token` value and use it as `Bearer <token>` in the Authorization header.

### Step 2: Test Asynchronous Task Creation (Default)
- **Method**: `POST`
- **URL**: `http://localhost:5000/tasks`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "title": "Async Architecture Task",
    "description": "Testing Practical 10 EventEmitter"
  }
  ```
- **Observed Behavior**:
  - Client response is received in ~20-30 ms.
  - Server console outputs:
    ```
    [API] Response sent at 2026-10-27T09:39:45.869Z
    [Event] task-created handler STARTED at 2026-10-27T09:39:45.871Z
    [Notification] Task "Async Architecture Task" created | user: tanvi@example.com | time: 2026-10-27T09:39:47.879Z
    [Event] task-created handler COMPLETED at 2026-10-27T09:39:47.879Z
    ```

### Step 3: Test Synchronous Task Creation Demo (`?mode=sync`)
- **Method**: `POST`
- **URL**: `http://localhost:5000/tasks?mode=sync`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "title": "Sync Blocking Task",
    "description": "Testing mode=sync comparison"
  }
  ```
- **Observed Behavior**:
  - Client waits ~2,000 ms before receiving the response.
  - Server console outputs:
    ```
    [Event] task-created handler STARTED at 2026-10-27T09:39:48.894Z
    [Notification] Task "Sync Blocking Task" created | user: tanvi@example.com | time: 2026-10-27T09:39:50.914Z
    [Event] task-created handler COMPLETED at 2026-10-27T09:39:50.914Z
    [API] (SYNC) Response sent at 2026-10-27T09:39:50.914Z
    ```

### Step 4: Test Simulated Failure (`FAIL_NOTIFY`)
- **Method**: `POST`
- **URL**: `http://localhost:5000/tasks`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "title": "Task with FAIL_NOTIFY error demo",
    "description": "Testing error event listener"
  }
  ```
- **Observed Behavior**:
  - Client receives HTTP 201 immediately.
  - Server console outputs:
    ```
    [API] Response sent at ...
    [Event] task-created handler STARTED at ...
    [Event Error] Simulated notification failure for task: "Task with FAIL_NOTIFY error demo" at ...
    ```
  - Server remains healthy and operational.

### Step 5: Test Task Deletion Event
- **Method**: `DELETE`
- **URL**: `http://localhost:5000/tasks/<taskId>`
- **Headers**:
  - `Authorization: Bearer <token>`
- **Observed Behavior**:
  - Client receives `{ "message": "Task deleted successfully.", "id": "..." }`.
  - Server console outputs:
    ```
    [Event] Task deleted | id: <taskId> | title: "Async Architecture Task" | time: 2026-10-27T09:39:51.955Z
    ```

---

## 11. Screenshots List / Verification Proofs

When preparing the lab submission, include the following screenshots:
1. **Server Startup**: Terminal showing `Server running on port 5000` and MongoDB connection message.
2. **Postman / Thunder Client POST /tasks (Async)**: Showing fast response time (~23 ms) with status `201 Created`.
3. **Server Terminal Logs (Async)**: Showing `[API] Response sent` appearing before `[Notification]` and `[Event] COMPLETED`.
4. **Postman / Thunder Client POST /tasks?mode=sync**: Showing blocked response time (~2,028 ms).
5. **Server Terminal Logs (Sync)**: Showing `[API] (SYNC) Response sent` appearing after `[Event] COMPLETED`.
6. **Error Resilience Demonstration**: Showing `[Event Error]` logged without server exit when `FAIL_NOTIFY` task is sent.
7. **Task Deletion Event**: Showing `[Event] Task deleted` logged after deletion.

---

## 12. Key Questions and Answers

### Q1. Why does emitting an event not block the API response on the same Node.js process?
**Answer**: 
In Node.js, `taskEvents.emit('task-created', savedTask)` invokes registered event listener functions synchronously in the order they were registered. However, because our listener `handleTaskCreated` is declared as an `async` function and contains asynchronous non-blocking operations (`setTimeout` wrapped in a Promise, Mongoose database queries):
1. The listener executes synchronously up to the first `await` statement.
2. When the `await` is encountered, Node.js registers the timer callback with the internal libuv event loop timer queue and yields execution back to the caller.
3. Because the HTTP response has already been dispatched via `res.status(201).json(savedTask)` prior to or during this cycle, the HTTP response headers and body are immediately flushed across the network socket to the client.
4. Node.js continues processing other incoming HTTP requests, and only when the timer expires does the event loop execute the continuation of the listener callback to log the notification. Thus, the client is never blocked waiting for the background work.

### Q2. What happens to response time if the notification logic is inside the POST route?
**Answer**:
If the notification logic resides directly inside the POST route handler (as demonstrated by `?mode=sync`):
1. **Direct Latency Penalty**: The API response time is directly increased by the duration of the notification. A 2,000 ms notification delay causes the API response time to surge from ~23 ms to over 2,028 ms (an 88x increase in latency).
2. **Poor User Experience**: End-users experience visible lag and frozen interfaces while waiting for operations that they do not need to observe immediately.
3. **Fragile Transaction**: If the notification service experiences network timeouts (e.g., waiting 10–30 seconds for an SMTP server), the client HTTP connection may timeout.
4. **Cascading Failure**: A failure in the notification step could trigger the route's error handler, mistakenly reporting an error to the client even though the task record was already safely committed to MongoDB.

### Q3. Why is EventEmitter fine at this scale but not for millions of events per day?
**Answer**:
Node.js's built-in `EventEmitter` is an excellent in-process pub/sub mechanism for small to medium scale applications, but it has distinct architectural limitations at enterprise scale (e.g., millions of events per day):
1. **Volatile Memory (No Persistence)**: `EventEmitter` stores event queues entirely in the V8 process RAM. If the Node.js server crashes, reboots, or is restarted for deployment while events are queued, all in-flight events are permanently lost with no recovery mechanism.
2. **Single-Process Bound (Not Distributed)**: `EventEmitter` cannot cross process or server boundaries. If the application is scaled horizontally across multiple instances (e.g., 5 containers behind an NGINX load balancer), an event emitted on Container A cannot be received or processed by Container B.
3. **No Retries or Dead Letter Queues (DLQ)**: Built-in `EventEmitter` lacks built-in retry backoff policies, rate limiting, task acknowledgement (ACK/NACK), and dead-letter queues needed when external third-party notification APIs fail or are throttled.
4. **Memory Pressure & Backpressure**: Heavy traffic bursts of millions of events can cause thousands of uncompleted Promise closures to accumulate in RAM, leading to V8 garbage collection freezes or `JavaScript heap out of memory` crashes.
5. **Production Solution**: For enterprise scale, distributed message brokers and persistent queue systems such as **RabbitMQ**, **Apache Kafka**, **Redis BullMQ**, or **AWS SQS** are used to provide durability, horizontal scaling, guaranteed delivery, and consumer load balancing.

---

## 13. Supplementary Problems and Real-World Considerations

### Problem 1: Ensuring Event Delivery Reliability (At-Least-Once Delivery)
In mission-critical systems (e.g., financial ledgering, order confirmation), an in-memory event can be lost if a process abruptly terminates. To achieve reliability:
- Implement the **Outbox Pattern**: Save both the entity (Task) and the pending event (OutboxEvent) in the same atomic MongoDB transaction session (`mongoose.startSession()`).
- A background worker reads unprocessed outbox events, dispatches them to the notification system, and marks them as processed upon confirmation.

### Problem 2: Rate Limiting & External API Throttling
Third-party notification providers (Twilio, SendGrid) impose strict rate limits (e.g., maximum 50 emails per second). Emitting thousands of concurrent events directly can trigger HTTP 429 (Too Many Requests).
- Use a persistent job queue (like `BullMQ` backed by Redis) to throttle event processing, batch outgoing notifications, and enforce exponential backoff retries.

---

## 14. Conclusion
In Practical 10, Asynchronous Processing with Event-Driven Architecture was successfully implemented using Node.js's native `EventEmitter`. Secondary notification and logging concerns were decoupled from the HTTP request-response cycle. Empirical testing proved an approximate **98.8% reduction in client-facing latency** (from ~2,028 ms down to ~23 ms). The dedicated `error` event listener ensured that unexpected background failures do not destabilize the server process, while the architecture preserves clean separation of concerns and full compatibility with MongoDB, JWT auth, and in-memory caching.
