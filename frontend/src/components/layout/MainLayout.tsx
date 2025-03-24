// MainLayout.tsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './MainLayout.css';

const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  // Ustawiamy zmienną CSS --sidebar-width na 250px (otwarty) lub 60px (zwinięty)
  const layoutStyle = {
    '--sidebar-width': sidebarOpen ? '250px' : '60px'
  } as React.CSSProperties;

  return (
    <div className="app-container" style={layoutStyle}>
      <Sidebar isOpen={sidebarOpen} />
      <div className="content-wrapper">
        <TopBar
          toggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
          darkMode={false}
          toggleDarkMode={() => {}}
        />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
