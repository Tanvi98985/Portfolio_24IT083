# Portfolio_24IT083

A personal portfolio website built with React and Vite to showcase my projects, skills, and contact information. The application also integrates the GitHub REST API to dynamically display my public repositories.

---

## Features

- Responsive portfolio website
- Multi-page navigation using React Router
- Reusable React components
- Dynamic GitHub repository listing
- Search repositories by name
- Loading spinner while fetching data
- Error handling with retry option
- Displays repository name, repository link, and star count
- Clean and modern user interface

---

## Technologies Used

- React
- Vite
- JavaScript (ES6+)
- HTML5
- CSS3
- React Router
- GitHub REST API

---

## GitHub API

The application fetches public repositories using the GitHub REST API.

**API Endpoint**

```
https://api.github.com/users/Tanvi98985/repos
```

---

## Installation

Clone the repository:

```bash
git clone <repository-url>
```

Move into the project directory:

```bash
cd Portfolio_24IT083
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the application in your browser:

```
http://localhost:5173
```

---

## Project Structure

```
src
│── components
│   ├── About.jsx
│   ├── ErrorMessage.jsx
│   ├── Footer.jsx
│   ├── Header.jsx
│   ├── NavBar.jsx
│   ├── ProjectCard.jsx
│   ├── Skills.jsx
│   └── Spinner.jsx
│
│── pages
│   ├── Contact.jsx
│   ├── Home.jsx
│   ├── NotFound.jsx
│   └── Projects.jsx
│
├── App.jsx
├── App.css
├── index.css
└── main.jsx
```

---

## Practical Documentation

- [Practical 8: Route-Based Lazy Loading & Performance Optimization](docs/practical-8.md)
- [Practical 9: In-Memory Caching and Query Optimization](docs/practical-9.md)

### Practical 9 Features Added:
- **node-cache**: Server-side in-memory caching engine.
- **60-second TTL**: Automatic time-to-live expiration for cached tasks.
- **User-Specific Caching**: Isolated cache keys (`all_tasks_${userId}`) ensuring full user privacy.
- **Single-Task Caching**: Cached individual task lookup (`GET /tasks/:id`) with key `task_${userId}_${taskId}`.
- **Cache Invalidation**: Automatic cache deletion upon `POST`, `PUT`, and `DELETE` writes after successful database operations.
- **Cache Hit/Miss Counter**: In-memory counters tracking cache efficiency.
- **Cache Statistics Endpoint**: Protected debug endpoint `GET /tasks/cache/stats`.
- **Performance Testing**: Measured cached vs. uncached API latency.

---

## Author

**Tanvi Ramani**

B.Tech Information Technology

CHARUSAT University