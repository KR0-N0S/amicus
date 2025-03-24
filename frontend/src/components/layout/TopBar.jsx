import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBars, FaChevronLeft, FaSearch, FaBell, FaUser, 
  FaMoon, FaSun, FaSignOutAlt, FaCog 
} from 'react-icons/fa';
import useOutsideClick from '../../hooks/useOutsideClick';
import './TopBar.css';
import { useAuth } from '../../context/AuthContext';

const TopBar = ({ toggleSidebar, sidebarOpen, darkMode, toggleDarkMode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { logout, user } = useAuth();
  
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  
  useOutsideClick(userMenuRef, () => setUserMenuOpen(false));
  useOutsideClick(notificationsRef, () => setNotificationsOpen(false));
  
  const handleSearch = (e) => {
    e.preventDefault();
    // Implementacja wyszukiwania
    console.log('Searching for:', searchQuery);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
    if (notificationsOpen) setNotificationsOpen(false);
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    if (userMenuOpen) setUserMenuOpen(false);
  };
  
  // Przykładowe powiadomienia
  const notifications = [
    { id: 1, text: 'Nowe powiadomienie', time: '5 min temu', read: false },
    { id: 2, text: 'Aktualizacja systemu', time: '1 godz. temu', read: true },
  ];

  const userName = user ? user.first_name || user.email : 'Użytkownik';

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle" onClick={toggleSidebar}>
          {sidebarOpen ? <FaChevronLeft /> : <FaBars />}
        </button>
        
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-container">
            <input
              type="text"
              placeholder="Szukaj..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit">
              <FaSearch />
            </button>
          </div>
        </form>
      </div>
      
      <div className="topbar-right">
        <button 
          className="icon-button theme-toggle" 
          onClick={toggleDarkMode}
          title={darkMode ? "Przełącz na jasny motyw" : "Przełącz na ciemny motyw"}
        >
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>
        
        <div className="notification-container" ref={notificationsRef}>
          <button 
            className="icon-button notification-toggle" 
            onClick={toggleNotifications}
          >
            <FaBell />
            {notifications.some(n => !n.read) && <span className="notification-badge"></span>}
          </button>
          
          {notificationsOpen && (
            <div className="dropdown-menu notifications-menu">
              <h3>Powiadomienia</h3>
              {notifications.length > 0 ? (
                <ul>
                  {notifications.map(notification => (
                    <li 
                      key={notification.id} 
                      className={notification.read ? 'read' : 'unread'}
                    >
                      <div className="notification-content">
                        <p>{notification.text}</p>
                        <span className="notification-time">{notification.time}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-data">Brak powiadomień</p>
              )}
            </div>
          )}
        </div>
        
        <div className="user-container" ref={userMenuRef}>
          <button 
            className="user-toggle" 
            onClick={toggleUserMenu}
          >
            <span className="user-avatar">
              <FaUser />
            </span>
            <span className="user-name">{userName}</span>
          </button>
          
          {userMenuOpen && (
            <div className="dropdown-menu user-menu">
              <ul>
                <li onClick={() => navigate('/profile')}>
                  <FaUser /> Profil
                </li>
                <li onClick={() => navigate('/settings')}>
                  <FaCog /> Ustawienia
                </li>
                <li onClick={handleLogout}>
                  <FaSignOutAlt /> Wyloguj
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;