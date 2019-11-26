import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { ListItem, ListItemIcon, ListItemText, Tooltip } from '@material-ui/core';
import { SidebarContext } from '../../contexts/SidebarContext';


function ExpandableSidebarAction(props) {

  const {
    icon,
    label,
    onClick,
  } = props;

  const [ amOpen ] = useContext(SidebarContext);

  function myOnClick () {
    onClick();
  }

  return (
    <ListItem
      button
      onClick={myOnClick}
    >
      <Tooltip title={label}>
        <ListItemIcon>
          {React.cloneElement(icon)}
        </ListItemIcon>
      </Tooltip>
      {amOpen && (
        <ListItemText>
          {label}
        </ListItemText>
      )}
    </ListItem>
  );
}

ExpandableSidebarAction.propTypes = {
  icon: PropTypes.element.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default ExpandableSidebarAction;