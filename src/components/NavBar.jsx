import { NavLink } from 'react-router-dom';

function NavBar() {
  return (
    <nav className="navbar">
      <NavLink
        to="/"
        end
        className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
      >
        Home
      </NavLink>
      <NavLink
        to="/projects"
        className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
      >
        Projects
      </NavLink>
      <NavLink
        to="/contact"
        className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
      >
        Contact
      </NavLink>
    </nav>
  );
}

export default NavBar;
