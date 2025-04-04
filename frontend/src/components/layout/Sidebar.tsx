import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FaHome,
  FaUsers,
  FaPaw,
  FaFlask,
  FaBook,
  FaSyringe,
  FaPills,
  FaBuilding,
  FaChevronDown,
  FaChevronUp,
  FaPlus,
} from 'react-icons/fa';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onLinkClick?: () => void;
}

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  path?: string;
  submenuKey?: string;
  submenu?: boolean;
  items?: Array<{
    title: string;
    path: string;
    addNew?: string;
  }>;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onLinkClick }) => {
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({});
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Czyścimy rozwinięte menu przy zamknięciu sidebaru
  useEffect(() => {
    if (!isOpen) {
      setExpandedMenus({});
    }
  }, [isOpen]);

  // Jeśli sidebar jest zamknięty i klikniemy poza nim – zamyka rozwinięte podmenu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isOpen && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setExpandedMenus({});
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleSubmenu = (menuKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Niezależnie od stanu sidebaru – zamykamy wszystkie submenu i otwieramy tylko kliknięty
    setExpandedMenus(prev => ({ [menuKey]: !prev[menuKey] }));
  };

  const handleAddNew = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(path);
  };

  const menuItems: MenuItem[] = [
    {
      title: 'Panel główny',
      icon: <FaHome />,
      path: '/dashboard',
    },
    {
      title: 'Klienci',
      icon: <FaUsers />,
      submenuKey: 'clients',
      submenu: true,
      items: [
        { title: 'Lista', path: '/clients', addNew: '/clients/new' },
        { title: 'Rozliczenia', path: '/clients/invoices' },
      ],
    },
    {
      title: 'Zwierzęta',
      icon: <FaPaw />,
      submenuKey: 'animals',
      submenu: true,
      items: [
        { title: 'Gospodarskie', path: '/animals/farm', addNew: '/animals/farm/new' },
        { title: 'Domowe', path: '/animals/pets', addNew: '/animals/pets/new' },
        { title: 'Ustawienia', path: '/animals/settings' },
      ],
    },
    {
      title: 'Laboratorium',
      icon: <FaFlask />,
      submenuKey: 'lab',
      submenu: true,
      items: [
        { title: 'Bakteriologia', path: '/lab/bacteriology' },
        { title: 'Biochemia', path: '/lab/biochemistry' },
        { title: 'Parazytologia', path: '/lab/parasitology' },
      ],
    },
    {
      title: 'Dokumentacja',
      icon: <FaBook />,
      submenuKey: 'medical',
      submenu: true,
      items: [
        { title: 'Książki Leczenia Dużych Zwierząt', path: '/medical/large', addNew: '/medical/large/new' },
        { title: 'Książki Leczenia Małych Zwierząt', path: '/medical/small', addNew: '/medical/small/new' },
      ],
    },
    {
      title: 'Inseminacje',
      icon: <FaSyringe />,
      submenuKey: 'inseminations',
      submenu: true,
      items: [
        { title: 'Dodaj nową', path: '/insemination/new' },
        { title: 'Rejestr unasienniania', path: '/insemination/inseminations' },
        { title: 'Buhaje', path: '/insemination/bulls' },
        { title: 'Magazyn', path: '/insemination/deliveries' },
      ],
    },
    {
      title: 'Leki',
      icon: <FaPills />,
      submenuKey: 'medicines',
      submenu: true,
      items: [
        { title: 'Magazyn', path: '/medicines/inventory' },
        { title: 'Definicje leków', path: '/medicines/definitions', addNew: '/medicines/definitions/new' },
      ],
    },
    {
      title: 'Kontrahenci',
      icon: <FaBuilding />,
      path: '/contractors',
    },
  ];

  // Funkcja pomocnicza wywołująca onLinkClick tylko na mobile
  const handleLinkClick = () => {
    if (window.innerWidth < 768 && onLinkClick) {
      onLinkClick();
    }
  };

  return (
    <div ref={sidebarRef} className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <img src="/images/logo.svg" alt="Logo" className="sidebar-logo" />
        {isOpen && <span className="sidebar-title">vetcloud.pl</span>}
      </div>
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item, index) => (
            <li key={index}>
              {item.submenu ? (
                <>
                  <div
                    className={`menu-item with-submenu ${expandedMenus[item.submenuKey!] ? 'expanded' : ''}`}
                    onClick={(e) => toggleSubmenu(item.submenuKey!, e)}
                  >
                    <span className="icon">{item.icon}</span>
                    {isOpen && <span className="title">{item.title}</span>}
                    {isOpen && (
                      <span className="arrow">
                        {expandedMenus[item.submenuKey!] ? <FaChevronUp /> : <FaChevronDown />}
                      </span>
                    )}
                  </div>
                  {expandedMenus[item.submenuKey!] && (
                    <ul className={`submenu ${!isOpen ? 'floating' : ''}`}>
                      {item.items &&
                        item.items.map((subItem, subIndex) => (
                          <li key={subIndex} className="submenu-item-container">
                            <NavLink
                              to={subItem.path}
                              onClick={handleLinkClick}
                              className={({ isActive }) => (isActive ? 'submenu-item active' : 'submenu-item')}
                            >
                              {subItem.title}
                            </NavLink>
                            {subItem.addNew && (
                              <button
                                className="add-new-button"
                                onClick={(e) => handleAddNew(subItem.addNew!, e)}
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
                  to={item.path!}
                  onClick={handleLinkClick}
                  className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
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