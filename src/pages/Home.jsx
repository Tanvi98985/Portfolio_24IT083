import Header from '../components/Header.jsx';
import About from '../components/About.jsx';
import Skills from '../components/Skills.jsx';

const skillList = [
  'Python',
  'JavaScript',
  'React',
  'HTML/CSS',
  'C',
  'C++',
  'Java',
  'Node.js',
  'MongoDB',
  'MYSQL',
  'numpy',
  'Pandas',
  'Matplotlib',
  'OpenCV',
  'Seaborn',
  'MediaPipe',
  'TensorFlow',
  'Git & GitHub',
];

function Home() {
  return (
    <>
      <Header name="Tanvi" />
      <About />
      <Skills skillList={skillList} />
    </>
  );
}

export default Home;
