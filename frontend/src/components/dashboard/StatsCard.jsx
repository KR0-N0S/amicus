import React from 'react';
import './StatsCard.css';

const StatsCard = ({ title, value, icon, trend, trendValue, color }) => {
  return (
    <div className={`stats-card ${color}`}>
      <div className="stats-icon">{icon}</div>
      
      <div className="stats-content">
        <h3 className="stats-title">{title}</h3>
        <p className="stats-value">{value}</p>
        
        {trend && (
          <div className={`stats-trend ${trend}`}>
            <span className="trend-arrow">
              {trend === 'up' ? '↑' : '↓'}
            </span>
            <span className="trend-value">{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
