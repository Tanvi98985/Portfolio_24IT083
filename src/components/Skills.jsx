function Skills({ skillList }) {
  return (
    <section className="skills">
      <h2>Skills</h2>
      <div className="skills-list">
        {skillList.map((skill) => (
          <span className="skill-badge" key={skill}>
            {skill}
          </span>
        ))}
      </div>
    </section>
  );
}

export default Skills;
