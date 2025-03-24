import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaExclamationTriangle } from 'react-icons/fa';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="not-found-icon">
          <FaExclamationTriangle />
        </div>
        <h1>404</h1>
        <h2>Strona nie znaleziona</h2>
        <p>Przepraszamy, ale strona której szukasz nie istnieje.</p>
        <Link to="/" className="btn btn-primary">
          <FaHome className="btn-icon" /> Wróć na stronę główną
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
