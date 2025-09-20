import { Link } from 'react-router-dom';
import "../App.css";
import "bootstrap/dist/css/bootstrap.min.css";
export default function AboutMe() {
  return (
    <div className="cyber-app">
      {/* Cyberpunk Background Effects */}
      <div className="cyber-background">
        <div className="matrix-rain">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className={`matrix-column column-${i}`}>
              {Array.from({ length: 20 }).map((_, j) => (
                <span key={j} className="matrix-char">
                  {String.fromCharCode(0x30A0 + Math.random() * 96)}
                </span>
              ))}
            </div>
          ))}
        </div>
        
        <div className="cyber-grid">
          {Array.from({ length: 100 }).map((_, i) => (
            <div key={i} className="grid-line" />
          ))}
        </div>
        
        <div className="neural-circuits">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={`circuit-node pulse-${i % 3}`}>
              <div className="node-core" />
              <div className="node-ring" />
            </div>
          ))}
        </div>
      </div>

      {/* HUD Header */}
      <div className="cyber-hud-header">
        <div className="hud-section">
          <div className="status-indicator" style={{ color: 'var(--cyber-success)' }}>
            <span className="status-dot"></span>
            ABOUT ME 
          </div>
        </div>
        
        <div className="hud-section">
          <div className="nav-links">
            <Link to="/" className="cyber-nav-link">
               <span>← BACK TO SYSTEM</span>
            </Link>
          </div>
        </div>
      </div>

      <main className="container-fluid py-4 cyber-main">
        <div className="row g-4 max-width-container mx-auto">
          
          {/* Hero Section */}
          <div className="col-12">
            <div className="card text-center hero-card">
              <div className="card-body p-5">
                <div className="profile-avatar mb-4">
                  <div className="avatar-ring">
                    <div className="avatar-core">
                      <img 
                        src="public\AvatarOns.png" 
                        alt="Ons Zammel Profile" 
                        className="profile-image"
                        
                      />








                      <i className="fas fa-user-astronaut fa-3x"></i>
                    </div>
                    <div className="avatar-pulse"></div>
                  </div>
                </div>
                <h1 className="display-4 fw-bold cyber-title mb-3">
                  <span className="logo-bracket">[</span>
                  ONS ZAMMEL
                  <span className="logo-bracket">]</span>
                </h1>
                <p className="lead mb-4 cyber-subtitle">
                  Junior ML Researcher & ENGINEER • Based In Porto • Master Graduate (coming soon)
                </p>
                <div className="typing-text">
                  <span className="typing-cursor">█</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="col-12 col-lg-8">
            <div className="card h-100">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="fas fa-brain me-2"></i>
                  NEURAL PROFILE
                </h5>
              </div>
              <div className="card-body">
                <div className="bio-section mb-4">
                  <h6 className="cyber-section-title">
                    <span className="section-icon">▶</span> INITIALIZATION
                  </h6>
                  <p className="cyber-text">
                    Welcome to my digital realm. I'm Ons Zammel, Master Student, Grant Holder @FEUP and AI Engineer passionate about pushing 
                    the boundaries of Stress Testing Generative Models, machine learning applications and Focusing on Benchmarks Limitations. My journey began with curiosity 
                    about artificial intelligence and evolved into building systems that can think, learn, 
                    and evaluate themselves. I currently work as a Researcher Student Engineer where I Develop an automated stress testing the truthfulness
                    for Base LLMs Framework and implement the product
                  </p>
                </div>

                <div className="bio-section mb-4">
                  <h6 className="cyber-section-title">
                    <span className="section-icon">▶</span> CORE FUNCTIONS
                  </h6>
                  <div className="skill-tags">
                    <span className="skill-tag">Machine Learning</span>
                    <span className="skill-tag">Deep Learning</span>
                    <span className="skill-tag">NLP</span>
                    <span className="skill-tag">Model Evaluation</span>
                    <span className="skill-tag">Research</span>
                    <span className="skill-tag">Python</span>
                    <span className="skill-tag">TensorFlow</span>
                    <span className="skill-tag">PyTorch</span>
                    <span className="skill-tag">React</span>
                    <span className="skill-tag">Docker</span>
                    <span className="skill-tag">Kafka</span>
                    <span className="skill-tag">Hadoop</span>
                    <span className="skill-tag">HDFS</span>
                    <span className="skill-tag">ETL</span>
                    <span className="skill-tag">Pyspark</span>
                    <span className="skill-tag">PowerBI</span>
                    <span className="skill-tag">Jupyter Notebooks</span>
                    <span className="skill-tag">Stats and Linear Algebra</span>
                  </div>
                </div>

                <div className="bio-section">
                  <h6 className="cyber-section-title">
                    <span className="section-icon">▶</span> MISSION STATEMENT
                  </h6>
                  <p className="cyber-text">
                    My mission is to democratize AI evaluation and make Evaluation 
                    accessible to non technical scientists, researchers and starter ML engineers worldwide. Through innovative platforms 
                    like this LLM Evaluation System, I aim to bridge the gap between complex 
                    AI models and practical, user-friendly interfaces.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Panel */}
          <div className="col-12 col-lg-4">
            <div className="card h-100">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="fas fa-chart-line me-2"></i>
                  Experience and Activities
                </h5>
              </div>
              <div className="card-body">
                <div className="stat-item">
                  <div className="stat-label">Higher Education</div>
                  <div className="stat-value">Master Degree in Data Engineering and ML</div>
                  <div className="stat-bar">
                    <div className="stat-fill" style={{ width: '85%' }}></div>
                  </div>
                </div>
                
                <div className="stat-item">
                  <div className="stat-label">Professional experiences (Remote and Hybrid) </div>
                  <div className="stat-value">5+</div>
                  <div className="stat-bar">
                    <div className="stat-fill" style={{ width: '92%' }}></div>
                  </div>
                </div>
                
                <div className="stat-item">
                  <div className="stat-label">AI Projects</div>
                  <div className="stat-value">5</div>
                  <div className="stat-bar">
                    <div className="stat-fill" style={{ width: '78%' }}></div>
                  </div>
                </div>
                
                <div className="stat-item">
                  <div className="stat-label">CODE COMMITS</div>
                  <div className="stat-value">∞</div>
                  <div className="stat-bar">
                    <div className="stat-fill infinite-bar" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Showcase */}
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="fas fa-rocket me-2"></i>
                  PROJECT SHOWCASE: LLM_EVAL_SYS
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-4">
                  <div className="col-12 col-lg-6">
                    <h6 className="cyber-section-title mb-3">
                      <span className="section-icon">◆</span> SYSTEM OVERVIEW
                    </h6>
                    <p className="cyber-text">
                      The LLM Evaluation System represents the cutting edge of AI model assessment. 
                      Built with React and powered by advanced language models, this platform provides 
                      comprehensive evaluation metrics including BLEU scores, ROUGE metrics, semantic 
                      similarity, and AI-powered judgment.
                    </p>
                    
                    <div className="feature-list mt-4">
                      <div className="feature-item">
                        <i className="fas fa-check-circle feature-icon"></i>
                        <span>Real-time model evaluation</span>
                      </div>
                      <div className="feature-item">
                        <i className="fas fa-check-circle feature-icon"></i>
                        <span>Multiple metric calculations</span>
                      </div>
                      <div className="feature-item">
                        <i className="fas fa-check-circle feature-icon"></i>
                        <span>AI-powered quality assessment</span>
                      </div>
                      <div className="feature-item">
                        <i className="fas fa-check-circle feature-icon"></i>
                        <span>DataSet evaluation & Benchmarks</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-12 col-lg-6">
                    <h6 className="cyber-section-title mb-3">
                      <span className="section-icon">◆</span> TECHNICAL STACK
                    </h6>
                    <div className="tech-grid">
                      <div className="tech-item">
                        <div className="tech-icon">⚛️</div>
                        <div className="tech-name">React 18</div>
                        <div className="tech-desc">Frontend Framework</div>
                      </div>
                      <div className="tech-item">
                        <div className="tech-icon">🎨</div>
                        <div className="tech-name">Bootstrap 5</div>
                        <div className="tech-desc">Responsive Design</div>
                      </div>
                      <div className="tech-item">
                        <div className="tech-icon">🐍</div>
                        <div className="tech-name">Python</div>
                        <div className="tech-desc">Backend Logic</div>
                      </div>
                      <div className="tech-item">
                        <div className="tech-icon">🧠</div>
                        <div className="tech-name">LLMs</div>
                        <div className="tech-desc">AI Models</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="fas fa-satellite-dish me-2"></i>
                  COMMUNICATION CHANNELS
                </h5>
              </div>
              <div className="card-body text-center">
                <p className="cyber-text mb-4">
                  Ready to collaborate on the next breakthrough in AI? Let's connect through these neural pathways:
                </p>
                <div className="contact-links">
                  <a href="https://pt.linkedin.com/in/ons-zammel" target="_blank" rel="noopener noreferrer" className="contact-btn">
                    <i className="fab fa-linkedin contact-icon"></i>
                    <div className="contact-info">
                      <div className="contact-label">LINKEDIN</div>
                      <div className="contact-desc">Professional Network</div>
                    </div>
                  </a>
                  <a href="https://github.com/zammelRocks" target="_blank" rel="noopener noreferrer" className="contact-btn">
                    <i className="fab fa-github contact-icon"></i>
                    <div className="contact-info">
                      <div className="contact-label">GITHUB</div>
                      <div className="contact-desc">Code Repository</div>
                    </div>
                  </a> 
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="cyber-footer">
          <div className="footer-scanline"></div>
          <div className="footer-content" style={{ justifyContent: 'center' }}>
            <div className="footer-center">
              <div className="footer-logo mb-3">
                
                <span className="logo-text"> ZammelRocks </span>
                
              </div>
              
            </div>
          </div>
          <div className="footer-glitch"></div>
        </footer>
      </main>


    </div>
  );
}