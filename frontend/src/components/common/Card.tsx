import React from 'react';
import './Card.css';

interface CardProps {
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children, className, actions }) => {
  return (
    <div className={`card ${className || ''}`}>
      {title && (
        <div className="card-header">
          <div className="card-title">
            {typeof title === 'string' ? <h3>{title}</h3> : title}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
};

export default Card;