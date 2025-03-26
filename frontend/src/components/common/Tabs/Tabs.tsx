import React, { useState } from 'react';
import './Tabs.css';

interface TabProps {
  label: string;
  children: React.ReactNode;
}

export const Tab: React.FC<TabProps> = ({ children }) => {
  return <>{children}</>;
};

interface TabsProps {
  children: React.ReactElement<TabProps>[];
  defaultTab?: number;
}

const Tabs: React.FC<TabsProps> = ({ children, defaultTab = 0 }) => {
  const [activeTab, setActiveTab] = useState<number>(defaultTab);

  // Filtrujemy tylko elementy Tab
  const tabs = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && (child.type as any).name === 'Tab'
  ) as React.ReactElement<TabProps>[];

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
        {tabs[activeTab]}
      </div>
    </div>
  );
};

export default Tabs;