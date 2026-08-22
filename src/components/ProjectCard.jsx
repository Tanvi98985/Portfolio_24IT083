import { Link } from 'react-router-dom';

function ProjectCard({ title, description, tags = [], githubUrl, demoUrl }) {
  return (
    <div className="project-card">
      <h3>{title}</h3>
      <p>{description}</p>

      {tags && tags.length > 0 && (
        <div className="skills-list" style={{ marginTop: '0.9rem', gap: '0.4rem' }}>
          {tags.map((tag, index) => (
            <span
              key={index}
              className="skill-badge"
              style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {(githubUrl || demoUrl) && (
        <div style={{ marginTop: '1.2rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {demoUrl && (
            demoUrl.startsWith('/') ? (
              <Link
                to={demoUrl}
                className="submit-btn"
                style={{ textDecoration: 'none', display: 'inline-block', padding: '0.45rem 0.9rem', fontSize: '0.85rem', marginTop: 0 }}
              >
                Live Demo
              </Link>
            ) : (
              <a
                href={demoUrl}
                target="_blank"
                rel="noreferrer"
                className="submit-btn"
                style={{ textDecoration: 'none', display: 'inline-block', padding: '0.45rem 0.9rem', fontSize: '0.85rem', marginTop: 0 }}
              >
                Live Demo
              </a>
            )
          )}

          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="linkedin-link"
              style={{ textDecoration: 'none', display: 'inline-block', padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
            >
              GitHub Repo
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default ProjectCard;