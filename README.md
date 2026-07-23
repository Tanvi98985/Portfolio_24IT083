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

## Author

**Tanvi Ramani**

B.Tech Information Technology

CHARUSAT University