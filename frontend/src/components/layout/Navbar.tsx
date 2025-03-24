import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Menu, 
  MenuItem, 
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,  // Dodano ListItemButton
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  AccountCircle, 
  Dashboard, 
  Pets, 
  Science, 
  MedicalServices, 
  People,
  Business,
  ExitToApp
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { logout, isAuthenticated, getCurrentUser } from '../../utils/auth';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const user = getCurrentUser();
  const authenticated = isAuthenticated();
  
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    handleClose();
    logout();
  };
  
  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };
  
  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Zwierzęta', icon: <Pets />, path: '/animals' },
    { text: 'Byki', icon: <Science />, path: '/bulls' },
    { text: 'Inseminacje', icon: <MedicalServices />, path: '/inseminations' },
    { text: 'Wizyty', icon: <MedicalServices />, path: '/visits' },
  ];
  
  if (authenticated) {
    menuItems.push(
      { text: 'Użytkownicy', icon: <People />, path: '/users' },
      { text: 'Organizacje', icon: <Business />, path: '/organizations' }
    );
  }
  
  const drawer = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="div">
          AmicusApp
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton component={Link} to={item.path}>
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {authenticated && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
              AmicusApp
            </Link>
          </Typography>
          
          {authenticated ? (
            <div>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
                  Profil
                </MenuItem>
                <MenuItem onClick={handleLogout}>Wyloguj</MenuItem>
              </Menu>
            </div>
          ) : (
            <Box>
              <Button color="inherit" component={Link} to="/login">
                Logowanie
              </Button>
              <Button color="inherit" component={Link} to="/register">
                Rejestracja
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;
