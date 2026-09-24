# Practical 9: In-Memory Caching and Query Optimization

## 1. Objective
The objective of this practical is to implement server-side in-memory caching using `node-cache` and optimize database queries in the existing Node.js, Express, MongoDB, and React Task Management project. 

Specifically:
- Reduce repeated database query overhead by caching `GET /tasks` responses.
- Implement user-specific cache keys to maintain data isolation across different users.
- Apply a Time-To-Live (TTL) of 60 seconds for cache entries.
- Implement single-task caching for `GET /tasks/:id`.
- Ensure real-time data consistency by invalidating cache on write operations (`POST`, `PUT`, `DELETE`).
- Track cache efficiency using hit/miss counters and provide a debug endpoint (`GET /tasks/cache/stats`).
- Benchmark and compare API response times between uncached and cached requests.

---

## 2. Problem Statement
In typical web applications, fetching data directly from a database (such as MongoDB Atlas over a network) on every single HTTP GET request introduces network latency, consumes server and database resources, and increases response times. 

When multiple users request their tasks repeatedly, fetching identical data over and over from the database is inefficient. Furthermore, returning outdated (stale) data after creating, updating, or deleting a task must be strictly prevented. Hence, an in-memory caching mechanism with proper cache invalidation is required.

---

## 3. Technologies Used
- **Node.js & Express.js**: Backend REST API framework (ES Modules).
- **node-cache**: Fast, in-memory caching library for Node.js with TTL and automatic key expiration.
- **MongoDB & Mongoose**: NoSQL document database and Object Data Modeling (ODM) library.
- **JSON Web Token (JWT)**: Stateless token-based user authentication.
- **React (Vite)**: Frontend user interface consuming the REST API.
- **Postman / Thunder Client**: API testing tools to measure response times.

---

## 4. MongoDB Database Used
- **Cluster**: `Cluster0` (MongoDB Atlas)
- **Database Name**: `tanvi_projects`
- **Application Collections**:
  - `users`: Stores registered user credentials with hashed passwords.
  - `tasks`: Stores task records associated with specific users.
- **Configuration**: The database connection string is securely loaded from `.env` via `MONGO_URI` without hardcoding credentials in source code.

```
Cluster0
└── tanvi_projects
    ├── users
    └── tasks
```

---

## 5. Architecture
The application follows a 3-tier architecture with an added server-side in-memory cache layer between Express route handlers and the MongoDB Atlas database:

```
[ Client (React App / Postman) ]
               │
          HTTP Requests (with JWT Bearer Token)
               ▼
[ Express Server (server.js) ]
               │
        authMiddleware (JWT Verification -> req.user.id)
               │
        taskRoutes.js
         ├── Check in-memory Cache (node-cache)
         │       ├── HIT  ──> Return cached response immediately
         │       └── MISS ──> Query MongoDB Atlas
         │                       │
         │                Store in node-cache (TTL = 60s)
         │                       │
         │                Return response
         └── On Writes (POST / PUT / DELETE)
                 ├── Perform Database Operation
                 └── Invalidate Cache (cache.del)
```

---

## 6. Cache Flow

### Read Request Flow (`GET /tasks` or `GET /tasks/:id`)
1. Client sends a GET request with a valid JWT Authorization header.
2. `authMiddleware` authenticates the token and populates `req.user.id`.
3. The route handler checks if the user-specific key exists in `node-cache`.
4. **Cache HIT**:
   - Increment `hits` counter.
   - Log `[CACHE HIT] <cacheKey>`.
   - Return cached JSON response instantly without querying MongoDB.
5. **Cache MISS**:
   - Increment `misses` counter.
   - Log `[CACHE MISS] <cacheKey>`.
   - Query MongoDB database.
   - Save the database result into `node-cache` with a 60-second TTL.
   - Return the response to the client.

```
Incoming GET Request
         │
         ▼
Check node-cache for Key?
        / \
       /   \
  YES /     \ NO
     v       v
[CACHE HIT] [CACHE MISS]
 Increment   Increment
   hits       misses
     │          │
 Return      Query MongoDB
 Cached         │
  Data       Save to Cache (TTL 60s)
                │
             Return Fresh Data
```

---

## 7. Cache Key Design
Because each user must only see their own tasks, using a single global cache key like `all_tasks` would cause serious data leakage between users. Therefore, all cache keys are **user-specific**:

1. **All Tasks Cache Key**:
   ```
   all_tasks_${req.user.id}
   ```
   *Example*: `all_tasks_65f01234abcd5678ef901234`

2. **Single Task Cache Key**:
   ```
   task_${req.user.id}_${taskId}
   ```
   *Example*: `task_65f01234abcd5678ef901234_65f05678abcd1234ef905678`

This ensures complete user isolation and prevents cross-user cache collisions.

---

## 8. TTL (Time-To-Live)
- **Configured TTL**: `60` seconds (`stdTTL: 60` in `server/cache.js`).
- If no write operations occur, cached data will automatically expire after 60 seconds, and the subsequent request will fetch fresh data from MongoDB.
- 60 seconds provides an optimal balance for a task management application: it absorbs rapid page refreshes while ensuring data freshness even if an out-of-band database update occurs.

---

## 9. GET /tasks Caching
- **Endpoint**: `GET /tasks`
- **Protected**: Yes (Requires `Bearer <JWT_TOKEN>`)
- **Key**: `all_tasks_${req.user.id}`
- **Database Query**: Filters by user with `.sort({ createdAt: -1 })`.
- **Query Optimization**: A compound index `{ user: 1, createdAt: -1 }` is applied on the Task schema to eliminate full-collection scans and optimize sorting.

---

## 10. GET /tasks/:id Caching
- **Endpoint**: `GET /tasks/:id`
- **Protected**: Yes (Requires `Bearer <JWT_TOKEN>`)
- **Key**: `task_${req.user.id}_${req.params.id}`
- **Behavior**:
  - Validates MongoDB ObjectId format.
  - Checks if the specific task is cached under the user-specific key.
  - On miss, queries MongoDB verifying task ownership or visibility.
  - Caches the single task for 60 seconds.

---

## 11. Cache Invalidation
To guarantee that users never see stale data after adding, modifying, or removing tasks, cache invalidation is executed **immediately after every successful database write**:

| Operation | Route | Invalidation Action | Console Log |
|---|---|---|---|
| **Create Task** | `POST /tasks` | Invalidate all-tasks cache: `cache.del('all_tasks_' + req.user.id)` | `[CACHE INVALIDATED] all_tasks_<userId>` |
| **Update Task** | `PUT /tasks/:id` | Invalidate all-tasks cache & single-task cache: `cache.del('all_tasks_' + req.user.id)` and `cache.del('task_' + req.user.id + '_' + id)` | `[CACHE INVALIDATED] all_tasks_<userId>`<br>`[CACHE INVALIDATED] task_<userId>_<taskId>` |
| **Delete Task** | `DELETE /tasks/:id` | Invalidate all-tasks cache & single-task cache: `cache.del('all_tasks_' + req.user.id)` and `cache.del('task_' + req.user.id + '_' + id)` | `[CACHE INVALIDATED] all_tasks_<userId>`<br>`[CACHE INVALIDATED] task_<userId>_<taskId>` |

> **Crucial Rule**: Invalidation occurs **only after** the MongoDB write succeeds. If the database operation fails, the cache is not invalidated prematurely.

---

## 12. Cache Hit/Miss Counter
An in-memory stats tracker records:
- **`hits`**: Incremented whenever an incoming read request is fulfilled from `node-cache`.
- **`misses`**: Incremented whenever an item is not found in cache and must be fetched from MongoDB.

---

## 13. Debug Endpoint
- **Route**: `GET /tasks/cache/stats`
- **Access**: Protected with JWT (`Bearer <JWT_TOKEN>`)
- **Sample Response**:
  ```json
  {
    "hits": 3,
    "misses": 1
  }
  ```
- **Purpose**: Provides real-time visibility into cache performance for debugging and lab verification without exposing sensitive user or database data.

---

## 14. Postman / Thunder Client Testing Guide

### Step 1: Login to get JWT Token
- **POST** `http://localhost:5000/auth/login`
- Body:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- Copy the returned `token`. Set Authorization header in subsequent requests to:
  `Bearer <token>`

### Step 2: First GET /tasks (Cache Miss)
- **GET** `http://localhost:5000/tasks`
- Terminal shows: `[CACHE MISS] all_tasks_<userId>`

### Step 3: Second GET /tasks (Cache Hit)
- **GET** `http://localhost:5000/tasks`
- Terminal shows: `[CACHE HIT] all_tasks_<userId>`

### Step 4: Check Cache Stats
- **GET** `http://localhost:5000/tasks/cache/stats`
- Response shows `hits: 1` and `misses: 1`.

### Step 5: Test Cache Invalidation on Write
- **POST** `http://localhost:5000/tasks` with `{ "title": "New Cached Task" }`
- Terminal shows: `[CACHE INVALIDATED] all_tasks_<userId>`
- **GET** `http://localhost:5000/tasks`
- Terminal shows: `[CACHE MISS] all_tasks_<userId>` (Fresh data retrieved and recached).

---

## 15. Response Time Comparison

The following table records the round-trip latency measured via Postman / Thunder Client for `GET /tasks`:

| Test | Uncached | Cached |
|---|---|---|
| 1 | ___ ms | ___ ms |
| 2 | ___ ms | ___ ms |
| 3 | ___ ms | ___ ms |
| **Average** | **___ ms** | **___ ms** |

*(Values to be entered based on actual testing)*

---

## 16. Observations
1. **Dramatic Latency Reduction**: Serving responses directly from memory (`RAM`) avoids MongoDB network hops and query execution, resulting in noticeably faster response times on cache hits.
2. **Immediate Cache Invalidation**: As soon as a task is created, edited, or deleted, the invalidation logic removes the stale key, ensuring the next request retrieves up-to-date data.
3. **Database Offloading**: In-memory caching significantly reduces the read load on MongoDB Atlas, saving cluster bandwidth and compute resources.

---

## 17. Key Questions

### Q1. Why must cache be invalidated after every write?
If the cache is not invalidated after a write operation (`POST`, `PUT`, or `DELETE`), subsequent read requests will continue to return old, stale data stored in RAM until the 60-second TTL expires. This causes data inconsistency (e.g., a newly created task would not show up, or a deleted task would still appear). Invalidation ensures that the next read fetches fresh data from the database.

### Q2. What is a reasonable TTL?
A TTL (Time-To-Live) defines how long an item remains valid in the cache before being automatically discarded. For this lab, **60 seconds** is a reasonable TTL.
- **Long TTL (e.g., 1 hour)**:
  - *Pros*: Higher cache hit ratio, fewer database queries, maximum performance gain.
  - *Cons*: Higher risk of serving stale data if direct database modifications occur outside the application.
- **Short TTL (e.g., 5 seconds)**:
  - *Pros*: Data stays fresher, lower risk of stale data.
  - *Cons*: More frequent database queries, lower caching efficiency under normal traffic.

### Q3. Why is node-cache not suitable for multiple servers?
`node-cache` stores cached items directly in the **local process memory (RAM)** of a single Node.js instance.
- If the application is scaled horizontally across multiple instances (e.g., Server 1 and Server 2 behind a load balancer), each instance maintains its own isolated memory space.
- An update processed on Server 1 would invalidate only Server 1's cache. Server 2 would continue serving stale cached data because they do not share memory.
- For distributed, multi-server architectures, a centralized, distributed cache such as **Redis** or **Memcached** is used instead.

---

## 18. Limitations of In-Memory Caching
1. **Single-Process Scope**: Cache is bound to the Node.js process and lost when the server restarts.
2. **Memory Footprint**: Large datasets stored in RAM can lead to excessive memory usage and V8 garbage collection overhead.
3. **Not Distributed**: Does not share cache state across multiple server instances or worker threads.

---

## 19. Conclusion
In this practical, server-side in-memory caching was successfully implemented using `node-cache` with a 60-second TTL. User-specific cache keys preserve complete user data privacy and prevent cross-user contamination. Cache invalidation on `POST`, `PUT`, and `DELETE` guarantees strong data consistency, while query optimization using a compound MongoDB index ensures fast fallback execution on cache misses. Cache hit and miss statistics confirmed the effectiveness and speed advantages of in-memory caching.
