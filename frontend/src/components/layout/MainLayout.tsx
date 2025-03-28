import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './MainLayout.css';

const MainLayout: React.FC = () => {
  const isMobile = window.innerWidth < 768;
  // Sidebar domyślnie: zamknięty na mobile, otwarty na desktop
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(isMobile ? false : true);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  // Ustawiamy zmienną CSS: na desktop wartość "250px"/"60px", na mobile (poniżej 768px) "80%" po otwarciu
  const sidebarWidth = sidebarOpen ? (isMobile ? '80%' : '250px') : '60px';
  const layoutStyle = {
    '--sidebar-width': sidebarWidth
  } as React.CSSProperties;

  // Dodaj obsługę gestu przesunięcia w lewo
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX !== null) {
      const touchEndX = e.changedTouches[0].clientX;
      if ((touchStartX - touchEndX) > 50 && sidebarOpen) {
        toggleSidebar();
      }
      setTouchStartX(null);
    }
  };

  return (
    <div 
      className="app-container" 
      style={layoutStyle}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Sidebar isOpen={sidebarOpen} onLinkClick={toggleSidebar} />
      <div 
        className={`content-wrapper ${sidebarOpen ? 'content-pushed' : ''}`}
        onClick={() => window.innerWidth < 768 && sidebarOpen && toggleSidebar()}
      >
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
