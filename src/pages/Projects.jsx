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
          description="Responsive React portfolio."
        />

        <ProjectCard
          title="Weather App"
          description="Weather application using API."
        />

        <ProjectCard
          title="Parking Booking"
          description="React parking slot booking."
        />

        <ProjectCard
          title="Sign to Text"
          description="Converts sign language gestures into text using computer vision."
        />

        <ProjectCard
          title="MyShop"
          description="E-commerce web app for browsing and purchasing products."
        />

        <ProjectCard
          title="Campus Bazar"
          description="Platform for students to buy and sell items within campus."
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