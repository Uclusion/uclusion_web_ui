import React from 'react';
import { List, ListItem, ListItemIcon, ListItemText, Tooltip } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import { useIntl } from 'react-intl';

function PlanningSidebarActions(props) {
  const intl = useIntl();

  const { onClick, amOpen } = props;

  function handleAdd() {
    onClick();
  }

  // if not open just display icon
  if (!amOpen) {
    return (
      <List>
        <ListItem
          button
          onClick={handleAdd}
        >
          <ListItemIcon>
            <Tooltip title={intl.formatMessage({ id: 'addOptionLabel' })}>
              <AddIcon />
            </Tooltip>
          </ListItemIcon>
        </ListItem>
      </List>
    );
  }

  return (
    <List>
      <ListItem
        button
        onClick={handleAdd}
      >
        <ListItemIcon>
          <AddIcon />
        </ListItemIcon>
        <ListItemText>
          {intl.formatMessage({ id: 'addOptionLabel' })}
        </ListItemText>
      </ListItem>
    </List>
  );
}

export default PlanningSidebarActions;