import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Menu, MenuItem } from '@material-ui/core';
import { preventDefaultAndProp } from '../../utils/marketIdPathFunctions';

// J-all-392: shared shell for the menu-before-action pattern the All Done
// button and NotificationMenuButton hand-roll. The single child is the
// trigger button; clicking it toggles the menu and each item runs its
// onClick after the menu closes.
function MenuButton(props) {
  const { items, children } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  return (
    <>
      {React.cloneElement(React.Children.only(children), {
        onClick: (event) => {
          preventDefaultAndProp(event);
          setAnchorEl(anchorEl ? null : event.currentTarget);
        }
      })}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)}
            onClose={(event) => {
              preventDefaultAndProp(event);
              setAnchorEl(null);
            }}>
        {items.map((item) => (
          <MenuItem id={item.id} key={item.id} onClick={(event) => {
            preventDefaultAndProp(event);
            setAnchorEl(null);
            item.onClick();
          }}>
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

MenuButton.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.node.isRequired,
    onClick: PropTypes.func.isRequired
  })).isRequired,
  children: PropTypes.element.isRequired
};

export default MenuButton;
