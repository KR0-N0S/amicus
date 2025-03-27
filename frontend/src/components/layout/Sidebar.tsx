import React, { useState } from 'react';
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

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({});
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const navigate = useNavigate();

  const toggleSubmenu = (menuKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedMenus(prev => {
      if (prev[menuKey]) {
        // Jeśli kliknięty submenu jest już otwarty, zamykamy go
        return {};
      } else {
        // Zamykamy wszystkie inne i otwieramy tylko wybrany submenu
        return { [menuKey]: true };
      }
    });
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
        { title: 'Zwierzęta gospodarskie', path: '/animals/farm', addNew: '/animals/farm/new' },
        { title: 'Zwierzęta domowe', path: '/animals/pets', addNew: '/animals/pets/new' },
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
      title: 'Dokumentacja Medyczna',
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
        { title: 'Dodaj nową', path: '/inseminations/new' },
        { title: 'Rejestr unasienniania', path: '/inseminations/register' },
        { title: 'Buhaje', path: '/inseminations/bulls' },
        { title: 'Magazyn', path: '/inseminations/inventory' },
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

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">{isOpen && <h2 className="app-logo">AmicusApp</h2>}</div>
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item, index) => (
            <li
              key={index}
              onMouseEnter={() => setHoveredItem(index)}
              onMouseLeave={() => setHoveredItem(null)}
            >
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
                  {(expandedMenus[item.submenuKey!] || (!isOpen && hoveredItem === index)) && (
                    <ul className={`submenu ${!isOpen ? 'floating' : ''}`}>
                      {item.items &&
                        item.items.map((subItem, subIndex) => (
                          <li key={subIndex} className="submenu-item-container">
                            <NavLink
                              to={subItem.path}
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
