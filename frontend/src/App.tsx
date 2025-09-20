import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AboutMe from './pages/AboutMe';
import EvaluateDataSet  from './pages/EvaluateDataSet';
import './App.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutMe />} />
        <Route path="/EvaluateDataSet" element={<EvaluateDataSet />} />

        
      </Routes>
    </Router>
  );
}