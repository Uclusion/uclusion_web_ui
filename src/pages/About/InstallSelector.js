import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core';
import _ from 'lodash';

// T-all-2296: PyTorch-style option matrix - each choice becomes an argument on the install
// command instead of the installer asking questions interactively.
const useStyles = makeStyles((theme) => {
  const isDark = theme.palette.type === 'dark';
  return {
    row: {
      display: 'flex',
      alignItems: 'stretch',
      marginBottom: '6px',
    },
    label: {
      flex: '0 0 30%',
      display: 'flex',
      alignItems: 'center',
      padding: '10px 12px',
      fontWeight: 600,
      fontSize: '0.875rem',
      backgroundColor: isDark ? '#2d333b' : '#f6f8fa',
      border: `1px solid ${isDark ? '#444c56' : '#e1e4e8'}`,
      borderRadius: '6px 0 0 6px',
    },
    option: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px 8px',
      fontSize: '0.875rem',
      cursor: 'pointer',
      userSelect: 'none',
      border: `1px solid ${isDark ? '#444c56' : '#e1e4e8'}`,
      borderLeft: 'none',
      backgroundColor: isDark ? undefined : 'white',
      '&:last-child': {
        borderRadius: '0 6px 6px 0',
      },
      '&:hover': {
        backgroundColor: isDark ? '#39414a' : '#f0f4f8',
      },
    },
    optionSelected: {
      backgroundColor: '#2D9CDB',
      color: 'white',
      '&:hover': {
        backgroundColor: '#2D9CDB',
      },
    },
  };
});

export const INSTALL_CLIENTS = [
  { key: 'claude', label: 'Claude Code' },
  { key: 'cursor', label: 'Cursor' },
  { key: 'codex', label: 'Codex' },
];

function InstallSelector(props) {
  const { scope, setScope, clients, setClients } = props;
  const classes = useStyles();

  function toggleClient(key) {
    if (clients.includes(key)) {
      // Keep at least one client selected so the command stays non-interactive
      if (_.size(clients) > 1) {
        setClients(clients.filter((client) => client !== key));
      }
    } else {
      setClients([...clients, key]);
    }
  }

  function optionClass(selected) {
    return selected ? `${classes.option} ${classes.optionSelected}` : classes.option;
  }

  return (
    <div>
      <div className={classes.row}>
        <div className={classes.label}>Install scope</div>
        <div className={optionClass(scope === 'global')} onClick={() => setScope('global')}
             id='installScopeGlobal'>
          Global
        </div>
        <div className={optionClass(scope === 'project')} onClick={() => setScope('project')}
             id='installScopeProject'>
          This project
        </div>
      </div>
      <div className={classes.row}>
        <div className={classes.label}>AI tools</div>
        {INSTALL_CLIENTS.map((client) => (
          <div key={client.key} className={optionClass(clients.includes(client.key))}
               onClick={() => toggleClient(client.key)} id={`installClient${client.key}`}>
            {client.label}
          </div>
        ))}
      </div>
    </div>
  );
}

InstallSelector.propTypes = {
  scope: PropTypes.string.isRequired,
  setScope: PropTypes.func.isRequired,
  clients: PropTypes.arrayOf(PropTypes.string).isRequired,
  setClients: PropTypes.func.isRequired,
};

export default InstallSelector;
