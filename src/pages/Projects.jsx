import { useState, useEffect } from "react";
import ProjectCard from "../components/ProjectCard";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";

function Projects() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const fetchRepos = () => {
    setLoading(true);
    setError(null);

    fetch("https://api.github.com/users/Tanvi98985/repos")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch repositories.");
        }
        return response.json();
      })
      .then((data) => {
        // Sort repositories by newest first
        const sortedRepos = data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

        setRepos(sortedRepos);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const filteredRepos = repos.filter((repo) =>
    repo.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchRepos} />;
  }

  return (
    <div className="container">
      <h1 className="page-title">Projects</h1>

      <p className="page-subtitle">
        A few things I've built while learning.
      </p>

      {/* Existing Portfolio Projects */}
      <div className="project-grid">
        <ProjectCard
          title="Portfolio Website"
          description="A responsive personal portfolio built with React to showcase my skills, projects, and development experience. Features a clean layout and easy navigation across different screen sizes."
        />

        <ProjectCard
          title="Weather App"
          description="A weather application that fetches weather information through an API and displays current conditions and forecasts for a selected location. Provides a simple and user-friendly interface for checking weather updates."
        />

        <ProjectCard
          title="Parking Booking"
          description="A parking slot booking application that allows users to view parking options and book available slots. Simplifies parking management through an organized and easy-to-use interface."
        />

        <ProjectCard
          title="Sign to Text"
          description="A computer vision-based application that recognizes sign language gestures and converts them into readable text. Uses image processing and hand gesture recognition to support sign-to-text translation."
        />

        <ProjectCard
          title="MyShop"
          description="An e-commerce web application for browsing products and exploring an online shopping experience. Organizes product information in a clear interface to make product discovery easier."
        />

        <ProjectCard
          title="Campus Bazar"
          description="A student-focused marketplace that helps users buy and sell items within their campus community. Makes it easier for students to discover available items and connect with potential buyers or sellers."
        />
      </div>

      {/* GitHub Repository Section */}
      <h2 className="repo-heading">GitHub Repositories</h2>

      <input
        type="text"
        className="search-box"
        placeholder="Search Repository..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="repo-list">
        {filteredRepos.length > 0 ? (
          filteredRepos.map((repo) => (
            <div key={repo.id} className="repo-card">
              <h3>{repo.name}</h3>

              <p>⭐ Stars: {repo.stargazers_count}</p>

              <a
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
              >
                View Repository
              </a>
            </div>
          ))
        ) : (
          <p>No repositories found.</p>
        )}
      </div>
    </div>
  );
}

export default Projects;
