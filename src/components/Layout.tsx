import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'

const DRAWER_WIDTH = 240

const navItems = [
  { label: 'Dashboard', to: '/' },
]

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const drawerContent = (
    <List disablePadding>
      {navItems.map(({ label, to }) => (
        <ListItem key={label} disablePadding>
          <ListItemButton
            component={NavLink}
            to={to}
            end
            onClick={() => setMobileOpen(false)}
            sx={{
              '&.active': {
                bgcolor: 'action.selected',
                '& .MuiListItemText-primary': { fontWeight: 500 },
              },
            }}
          >
            <ListItemText primary={label} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen((prev) => !prev)}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>
            Practicar
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
        open
      >
        <Toolbar />
        {drawerContent}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, px: 3, pb: 3, pt: 1 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}
