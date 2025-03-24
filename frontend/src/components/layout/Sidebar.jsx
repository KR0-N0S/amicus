import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FaHome, FaUsers, FaPaw, FaFlask, FaBook, FaSyringe, 
  FaPills, FaBuilding, FaChevronDown, FaChevronUp, FaPlus
} from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const [expandedMenus, setExpandedMenus] = useState({});
  const [hoveredItem, setHoveredItem] = useState(null);
  const navigate = useNavigate();
  
  const toggleSubmenu = (menuKey, e) => {
    e.stopPropagation();
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };
  
  const handleAddNew = (path, e) => {
    e.stopPropagation();
    navigate(path);
  };
  
  const menuItems = [
    {
      title: 'Panel główny',
      icon: <FaHome />,
      path: '/dashboard'
    },
    {
      title: 'Klienci',
      icon: <FaUsers />,
      submenuKey: 'clients',
      submenu: true,
      items: [
        { title: 'Lista', path: '/clients', addNew: '/clients/new' },
        { title: 'Rozliczenia', path: '/clients/invoices' }
      ]
    },
    {
      title: 'Zwierzęta',
      icon: <FaPaw />,
      submenuKey: 'animals',
      submenu: true,
      items: [
        { title: 'Zwierzęta gospodarskie', path: '/animals/farm', addNew: '/animals/farm/new' },
        { title: 'Zwierzęta domowe', path: '/animals/pets', addNew: '/animals/pets/new' }
      ]
    },
    {
      title: 'Laboratorium',
      icon: <FaFlask />,
      submenuKey: 'lab',
      submenu: true,
      items: [
        { title: 'Bakteriologia', path: '/lab/bacteriology' },
        { title: 'Biochemia', path: '/lab/biochemistry' },
        { title: 'Parazytologia', path: '/lab/parasitology' }
      ]
    },
    {
      title: 'Dokumentacja Medyczna',
      icon: <FaBook />,
      submenuKey: 'medical',
      submenu: true,
      items: [
        { title: 'Książki Leczenia Dużych Zwierząt', path: '/medical/large', addNew: '/medical/large/new' },
        { title: 'Książki Leczenia Małych Zwierząt', path: '/medical/small', addNew: '/medical/small/new' }
      ]
    },
    {
      title: 'Inseminacje',
      icon: <FaSyringe />,
      submenuKey: 'inseminations',
      submenu: true,
      items: [
        { title: 'Dodaj nową', path: '/inseminations/new' },
        { title: 'Rejestr unasienniania', path: '/inseminations/register' },
        { title: 'Buhaje', path: '/inseminations/bulls' },
        { title: 'Magazyn', path: '/inseminations/inventory' }
      ]
    },
    {
      title: 'Leki',
      icon: <FaPills />,
      submenuKey: 'medicines',
      submenu: true,
      items: [
        { title: 'Magazyn', path: '/medicines/inventory' },
        { title: 'Definicje leków', path: '/medicines/definitions', addNew: '/medicines/definitions/new' }
      ]
    },
    {
      title: 'Kontrahenci',
      icon: <FaBuilding />,
      path: '/contractors'
    }
  ];
  
  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        {isOpen && <h2 className="app-logo">AmicusApp</h2>}
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item, index) => (
            <li key={index} 
                onMouseEnter={() => setHoveredItem(index)} 
                onMouseLeave={() => setHoveredItem(null)}>
              {item.submenu ? (
                <>
                  <div 
                    className={`menu-item with-submenu ${expandedMenus[item.submenuKey] ? 'expanded' : ''}`} 
                    onClick={(e) => toggleSubmenu(item.submenuKey, e)}
                  >
                    <span className="icon">{item.icon}</span>
                    {isOpen && <span className="title">{item.title}</span>}
                    {isOpen && (
                      <span className="arrow">
                        {expandedMenus[item.submenuKey] ? <FaChevronUp /> : <FaChevronDown />}
                      </span>
                    )}
                  </div>
                  
                  {(expandedMenus[item.submenuKey] || (!isOpen && hoveredItem === index)) && (
                    <ul className={`submenu ${!isOpen ? 'floating' : ''}`}>
                      {item.items.map((subItem, subIndex) => (
                        <li key={subIndex} className="submenu-item-container">
                          <NavLink 
                            to={subItem.path} 
                            className={({isActive}) => isActive ? 'submenu-item active' : 'submenu-item'}
                          >
                            {subItem.title}
                          </NavLink>
                          {subItem.addNew && (
                            <button 
                              className="add-new-button"
                              onClick={(e) => handleAddNew(subItem.addNew, e)}
                              title={`Dodaj nowy ${subItem.title.toLowerCase()}`}
                            >
                              <FaPlus />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => 
                    `menu-item ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="icon">{item.icon}</span>
                  {isOpen && <span className="title">{item.title}</span>}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;