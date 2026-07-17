import ProjectCard from "../components/ProjectCard";

function Projects() {
  return (
    <div className="container">
      <h1 className="page-title">Projects</h1>
      <p className="page-subtitle">A few things I've built while learning.</p>

      <div className="project-grid">
        <ProjectCard
          title="Portfolio Website"
          description="Responsive React portfolio."
        />

        <ProjectCard
          title="Weather App"
          description="Weather using API."
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
    </div>
  );
}

export default Projects;