// src/components/Footer.tsx
import { API_BASE } from "../api";
import { FaLinkedin, FaGithub } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="cyber-footer d-flex justify-content-center">
      <div className="footer-scanline"></div>

      <div className="footer-content container d-flex flex-column align-items-center text-center">
        <div className="footer-links mb-2 d-flex align-items-center">
          <a
            href="https://pt.linkedin.com/in/ons-zammel"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link d-flex align-items-center me-3"
          >
            <FaLinkedin className="me-1" size={18} />
            <span>LINKEDIN</span>
          </a>

          <span className="link-separator mx-2">|</span>

          <a
            href="https://github.com/zammelRocks"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link d-flex align-items-center ms-3"
          >
            <FaGithub className="me-1" size={18} />
            <span>GITHUB</span>
          </a>
        </div>


        <div className="footer-api mt-1">
          <small className="text-light opacity-75">{API_BASE}</small>
        </div>
      </div>

      <div className="footer-glitch"></div>
    </footer>
  );
}
