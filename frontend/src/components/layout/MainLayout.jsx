import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './MainLayout.css';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark-mode');
  };
  
  return (
    <div className={`app-container ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      <Sidebar isOpen={sidebarOpen} />
      
      <div className={`main-content ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
        <TopBar 
          toggleSidebar={toggleSidebar} 
          sidebarOpen={sidebarOpen}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />
        
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;