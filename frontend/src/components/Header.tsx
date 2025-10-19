import { useEffect, useState } from 'react';

import "../App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from 'react-router-dom';

export default function Header({ busy }: { busy: boolean }) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

  return (
    <div className={`cyber-hud-header ${!isVisible ? 'hidden' : ''}`}>
      {/* Status Section */}
      <div className="hud-section">
        <div className="status-indicator" style={{ color: 'var(--cyber-success)' }}>
          <span className="status-dot"></span>
          NEURAL LINK ESTABLISHED
        </div>
      </div>
      
      {/* Navigation Section */}
      <div className="hud-section">
        <div className="cyber-nav-links">
          <Link to="/" className="cyber-nav-link">
            <i className="fas fa-home me-1"></i>
            <span>HOME</span>
          </Link>
          <Link to="/about" className="cyber-nav-link">
            <i className="fas fa-user me-1"></i>
            <span>ABOUT</span>
          </Link>
          <Link to="/EvaluateDataSet" className="cyber-nav-link">
            <i className="fas fa-user me-1"></i>
            <span>Evaluation</span>
          </Link>
          <Link to="/JudgeSampling" className="cyber-nav-link">
            <i className="fas fa-robot me-1"></i>
            <span>JUDGE SAMPLING</span>
          </Link>
        </div>
      </div>
      
      {/* System Stats Section */}
      <div className="hud-section cyber-stats">
        <div className="stat-item">
          <span className="stat-label">STATUS</span>
          <span className="stat-value cyber-glow">
            {busy ? "PROCESSING" : "READY"}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">API</span>
          <span className="stat-value cyber-highlight">ONLINE</span>
        </div>
      </div>


    </div>
  );
}