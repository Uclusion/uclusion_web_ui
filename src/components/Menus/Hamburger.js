import React, { useState } from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Menu from '@material-ui/core/Menu';
import { INFO_COLOR } from '../Buttons/ButtonConstants';

export default function Hamburger(props) {
  const { navMenu } = props;

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const recordPositionToggle = (event) => {
    if (anchorEl === null) {
      setAnchorEl(event.currentTarget);
      setMenuOpen(true);
    } else {
      setAnchorEl(null);
      setMenuOpen(false);
    }
  };

  return (
    <Toolbar disableGutters style={{marginLeft: '1rem'}}>
      <IconButton
        edge="start"
        aria-label="open drawer"
        onClick={recordPositionToggle}
        sx={{
          mr: 2,
          display: {
            xs: 'block',
            sm: 'none',
          }
        }}
      >
        <MenuIcon />
      </IconButton>

      {anchorEl && (
        <Menu
          id="hamburger-menu"
          open={menuOpen}
          onClose={recordPositionToggle}
          getContentAnchorEl={null}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          anchorEl={anchorEl}
          disableRestoreFocus
          PaperProps={{
            style: {
              backgroundColor: INFO_COLOR,
            }
          }}
        >
          <div onClick={recordPositionToggle}>
            {navMenu}
          </div>
        </Menu>
      )}
    </Toolbar>
  );
}