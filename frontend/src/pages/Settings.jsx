import React, { useState } from 'react';
import Card from '../components/common/Card';
import { FaShieldAlt, FaBell, FaGlobe, FaSave } from 'react-icons/fa';
import './Settings.css';

const Settings = () => {
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    app_notifications: true,
    marketing_emails: false,
  });
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };
  
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings({
      ...notificationSettings,
      [name]: checked
    });
  };
  
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    // Implement password change logic here
    console.log('Password change:', passwordData);
  };
  
  const handleNotificationSubmit = (e) => {
    e.preventDefault();
    // Implement notification settings update logic here
    console.log('Notification settings:', notificationSettings);
  };
  
  return (
    <div className="settings-page">
      <h1 className="page-title">Ustawienia</h1>
      
      <div className="settings-grid">
        <Card 
          title={
            <div className="card-title-with-icon">
              <FaShieldAlt className="card-title-icon" />
              <span>Bezpieczeństwo</span>
            </div>
          }
        >
          <form className="settings-form" onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="current_password">Aktualne hasło</label>
              <input
                type="password"
                id="current_password"
                name="current_password"
                value={passwordData.current_password}
                onChange={handlePasswordChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="new_password">Nowe hasło</label>
              <input
                type="password"
                id="new_password"
                name="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                required
              />
              <div className="password-hint">
                Hasło powinno zawierać co najmniej 8 znaków, w tym cyfry i znaki specjalne.
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirm_password">Potwierdź nowe hasło</label>
              <input
                type="password"
                id="confirm_password"
                name="confirm_password"
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                required
              />
            </div>
            
            <button type="submit" className="btn btn-primary">
              <FaSave className="btn-icon" /> Zmień hasło
            </button>
          </form>
        </Card>
        
        <Card 
          title={
            <div className="card-title-with-icon">
              <FaBell className="card-title-icon" />
              <span>Powiadomienia</span>
            </div>
          }
        >
          <form className="settings-form" onSubmit={handleNotificationSubmit}>
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="email_notifications"
                  checked={notificationSettings.email_notifications}
                  onChange={handleNotificationChange}
                />
                <span>Powiadomienia email</span>
                <div className="checkbox-hint">
                  Otrzymuj powiadomienia o ważnych zdarzeniach na swój adres email.
                </div>
              </label>
            </div>
            
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="app_notifications"
                  checked={notificationSettings.app_notifications}
                  onChange={handleNotificationChange}
                />
                <span>Powiadomienia w aplikacji</span>
                <div className="checkbox-hint">
                  Włącz lub wyłącz powiadomienia w aplikacji.
                </div>
              </label>
            </div>
            
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="marketing_emails"
                  checked={notificationSettings.marketing_emails}
                  onChange={handleNotificationChange}
                />
                <span>Emaile marketingowe</span>
                <div className="checkbox-hint">
                  Otrzymuj informacje o nowych funkcjach i aktualizacjach.
                </div>
              </label>
            </div>
            
            <button type="submit" className="btn btn-primary">
              <FaSave className="btn-icon" /> Zapisz ustawienia
            </button>
          </form>
        </Card>
        
        <Card 
          title={
            <div className="card-title-with-icon">
              <FaGlobe className="card-title-icon" />
              <span>Preferencje</span>
            </div>
          }
        >
          <form className="settings-form">
            <div className="form-group">
              <label htmlFor="language">Język</label>
              <select id="language" className="form-select">
                <option value="pl">Polski</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="timezone">Strefa czasowa</label>
              <select id="timezone" className="form-select">
                <option value="Europe/Warsaw">Europe/Warsaw (GMT+1)</option>
                <option value="Europe/London">Europe/London (GMT+0)</option>
                <option value="America/New_York">America/New_York (GMT-5)</option>
              </select>
            </div>
            
            <button type="submit" className="btn btn-primary">
              <FaSave className="btn-icon" /> Zapisz preferencje
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
