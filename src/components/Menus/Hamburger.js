import React, { useState } from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Box from '@material-ui/core/Box';

//drawer elements used
import Drawer from '@material-ui/core/Drawer';
import CloseIcon from '@material-ui/icons/Close';
import Divider from '@material-ui/core/Divider';


export default function Hamburger(props) {
  const { navMenu } = props;

  //react useState hook to save the current open/close state of the drawer, normally variables dissapear afte the function was executed
  const [open, setState] = useState(false);


  //function that is being called every time the drawer should open or close, the keys tab and shift are excluded so the user can focus between the elements with the keys
  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    //changes the function state according to the value of open
    setState(open);
  };

  return (
      <Toolbar disableGutters style={{marginLeft: '1rem'}}>
        <IconButton edge="start" aria-label="open drawer" onClick={toggleDrawer(true)}
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

        {/* The outside of the drawer */}
        <Drawer
          //from which side the drawer slides in
          anchor="left"
          //if open is true --> drawer is shown
          open={open}
          //function that is called when the drawer should close
          onClose={toggleDrawer(false)}
        >
          {/* The inside of the drawer */}
          <Box sx={{
            p: 2,
            height: 1,
          }}>
            <IconButton sx={{mb: 2}}>
              <CloseIcon onClick={toggleDrawer(false)} />
            </IconButton>

            <Divider sx={{mb: 2}} />
            <div onClick={toggleDrawer(false)}>
              {navMenu}
            </div>
          </Box>

        </Drawer>


      </Toolbar>
  );
}