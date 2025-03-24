import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './MainLayout.css';

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <div className="app-container">
      {/* Sidebar jako element flex */}
      <Sidebar isOpen={sidebarOpen} />
      <div className="content-wrapper">
        <TopBar
          toggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
          darkMode={false} // lub pobieraj stan darkMode z kontekstu
          toggleDarkMode={() => {}}
        />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
