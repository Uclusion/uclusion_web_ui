import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
    ListItem, ListItemIcon, Tooltip,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles((theme) => {
    return {
        horizontalCenter: {
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '11px',
            paddingBottom: '11px'
        }
    }
});

function SidebarMenuButton(props) {

  const { label:labelID, icon, onClick } = props;

  const intl = useIntl();
  const label = intl.formatMessage({ id: labelID });
  const classes = useStyles();

  return (
    <ListItem
      key={label}
      button
      onClick={onClick}
    >
      <Tooltip title={label}>
        <ListItemIcon className={classes.horizontalCenter}>
          <img src={icon} alt="" />
        </ListItemIcon>
      </Tooltip>
    </ListItem>
  );
}

SidebarMenuButton.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string,
  onClick: PropTypes.func,
};

SidebarMenuButton.defaultProps = {
  icon: '',
  label: '',
  onClick: () => {},
};

export default SidebarMenuButton;