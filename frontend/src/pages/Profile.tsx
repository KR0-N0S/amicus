import React, { useState, ChangeEvent, FormEvent } from 'react';
import Card from '../components/common/Card';
import { 
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, 
  FaIdBadge, FaBell, FaRegNewspaper 
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

interface User {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  street?: string;
  house_number?: string;
  city?: string;
  postal_code?: string;
}

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  street: string;
  house_number: string;
  city: string;
  postal_code: string;
}

type ActiveTab = 'personal' | 'employees' | 'notifications' | 'subscription';

const Profile: React.FC = () => {
  const { user } = useAuth() as { user: User | null };
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('personal');
  
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    street: user?.street || '',
    house_number: user?.house_number || '',
    city: user?.city || '',
    postal_code: user?.postal_code || '',
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Implementacja aktualizacji profilu
    console.log('Updated profile:', formData);
    setIsEditing(false);
  };

  return (
    <div className="profile-page">
      <h1 className="page-title">Profil użytkownika</h1>
      
      <div className="profile-layout">
        <div className="profile-sidebar">
          <Card>
            <div className="profile-avatar">
              <div className="avatar-placeholder">
                <FaUser />
              </div>
              <h2 className="profile-name">
                {user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user?.email}
              </h2>
              <p className="profile-email">{user?.email}</p>
            </div>
            
            <div className="profile-menu">
              <button 
                className={`profile-menu-item ${activeTab === 'personal' ? 'active' : ''}`} 
                onClick={() => { setActiveTab('personal'); setIsEditing(false); }}
              >
                <FaUser /> Dane osobowe
              </button>
              <button 
                className={`profile-menu-item ${activeTab === 'employees' ? 'active' : ''}`} 
                onClick={() => { setActiveTab('employees'); setIsEditing(false); }}
              >
                <FaIdBadge /> Profile pracowników
              </button>
              <button 
                className={`profile-menu-item ${activeTab === 'notifications' ? 'active' : ''}`} 
                onClick={() => { setActiveTab('notifications'); setIsEditing(false); }}
              >
                <FaBell /> Powiadomienia
              </button>
              <button 
                className={`profile-menu-item ${activeTab === 'subscription' ? 'active' : ''}`} 
                onClick={() => { setActiveTab('subscription'); setIsEditing(false); }}
              >
                <FaRegNewspaper /> Abonament
              </button>
            </div>
          </Card>
        </div>
        
        <div className="profile-content">
          {activeTab === 'personal' && (
            <Card 
              title="Dane osobowe" 
              actions={
                isEditing ? null : (
                  <button 
                    className="btn btn-primary"
                    onClick={() => setIsEditing(true)}
                  >
                    Edytuj profil
                  </button>
                )
              }
            >
              {!isEditing ? (
                <div className="profile-info">
                  <div className="info-group">
                    <h3>Dane kontaktowe</h3>
                    <div className="info-item">
                      <FaUser className="info-icon" />
                      <div>
                        <span className="info-label">Imię i nazwisko</span>
                        <span className="info-value">
                          {user?.first_name && user?.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : 'Nie podano'}
                        </span>
                      </div>
                    </div>
                    <div className="info-item">
                      <FaEnvelope className="info-icon" />
                      <div>
                        <span className="info-label">Email</span>
                        <span className="info-value">{user?.email}</span>
                      </div>
                    </div>
                    <div className="info-item">
                      <FaPhone className="info-icon" />
                      <div>
                        <span className="info-label">Telefon</span>
                        <span className="info-value">{user?.phone || 'Nie podano'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="info-group">
                    <h3>Adres</h3>
                    <div className="info-item">
                      <FaMapMarkerAlt className="info-icon" />
                      <div>
                        <span className="info-label">Ulica i numer</span>
                        <span className="info-value">
                          {user?.street && user?.house_number
                            ? `${user.street} ${user.house_number}`
                            : 'Nie podano'}
                        </span>
                      </div>
                    </div>
                    <div className="info-item">
                      <FaMapMarkerAlt className="info-icon" />
                      <div>
                        <span className="info-label">Miasto i kod pocztowy</span>
                        <span className="info-value">
                          {user?.city && user?.postal_code
                            ? `${user.city}, ${user.postal_code}`
                            : 'Nie podano'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form className="profile-form" onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="first_name">Imię</label>
                      <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="last_name">Nazwisko</label>
                      <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="phone">Telefon</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="street">Ulica</label>
                      <input
                        type="text"
                        id="street"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="house_number">Numer</label>
                      <input
                        type="text"
                        id="house_number"
                        name="house_number"
                        value={formData.house_number}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="city">Miasto</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="postal_code">Kod pocztowy</label>
                      <input
                        type="text"
                        id="postal_code"
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setIsEditing(false)}
                    >
                      Anuluj
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Zapisz zmiany
                    </button>
                  </div>
                </form>
              )}
            </Card>
          )}
          
          {activeTab === 'employees' && (
            <Card title="Profile pracowników" actions={null}>
              <div className="profile-info">
                {/* Tu umieść właściwą zawartość lub komponent dla profilu pracowników */}
                <p>Funkcjonalność profilu pracowników zostanie wkrótce wdrożona.</p>
              </div>
            </Card>
          )}
          {activeTab === 'notifications' && (
            <Card title="Powiadomienia" actions={null}>
              <div className="profile-info">
                {/* Tu umieść właściwą zawartość lub komponent dla powiadomień */}
                <p>Konfiguracja powiadomień zostanie wkrótce dostępna.</p>
              </div>
            </Card>
          )}
          {activeTab === 'subscription' && (
            <Card title="Abonament" actions={null}>
              <div className="profile-info">
                {/* Tu umieść właściwą zawartość lub komponent dotyczący abonamentu */}
                <p>Informacje o abonamencie – szczegóły oferty, ceny i opcje płatności – będą dostępne.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
