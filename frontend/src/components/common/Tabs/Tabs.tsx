import React, { useState } from 'react';
import './Tabs.css';

export interface TabProps {
  label: string;
  children: React.ReactNode;
}

export const Tab: React.FC<TabProps> = ({ children }) => {
  return <div className="tab-content">{children}</div>;
};

interface TabsProps {
  children: React.ReactNode;
  defaultTab?: number;
}

const Tabs: React.FC<TabsProps> = ({ children, defaultTab = 0 }) => {
  const [activeTab, setActiveTab] = useState<number>(defaultTab);

  // Filtrujemy tylko elementy Tab
  const tabs = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === Tab
  ) as React.ReactElement<TabProps>[];

  if (tabs.length === 0) {
    console.error('Komponent Tabs musi zawierać przynajmniej jeden komponent Tab');
    return null;
  }

  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {tabs.map((tab, index) => (
          <div
            key={index}
            className={`tab-button ${activeTab === index ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
          >
            {tab.props.label}
          </div>
        ))}
      </div>
      <div className="tabs-content">
        {tabs.map((tab, index) => (
          <div 
            key={index} 
            style={{ display: activeTab === index ? 'block' : 'none' }}
          >
            {tab}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tabs;