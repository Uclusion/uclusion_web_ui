import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Button, Grid, darken } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles((theme) => ({
  drawer: {
    flexShrink: 0,
    whiteSpace: 'nowrap',
    backgroundColor: '#3F6B72',
    overflowX: 'hidden',
  },
  actionContainer: {
    display: 'grid',
    gridTemplateRows: '135px 1fr 98px',
    height: '100vh',
  },
  actionContent: {
    paddingTop: '0',
    paddingBottom: '0',
    backgroundColor: 'rgba(0,0,0,0.19)',
  },
  button: {
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    margin: 8,
    padding: '6px 10px',
    textTransform: 'capitalize',
    backgroundColor: '#e0e0e0',
    [theme.breakpoints.down('sm')]: {
      lineHeight: '1.2rem'
    },
  },
  buttonPrimary: {
    backgroundColor: '#2d9cdb',
    color: '#fff',
    fontSize: '12px',
    '&:hover': {
      backgroundColor: darken('#2d9cdb', 0.08)
    },
    '&:focus': {
      backgroundColor: darken('#2d9cdb', 0.24)
    },
  },
  fullWidth: {
    width: '100%'
  },
  icon: {
    marginRight: '4px'
  }
}));

function ActionBar (props) {
  const classes = useStyles();
  const { actionBarActions } = props;

  const addNewClass = clsx(classes.button, classes.buttonPrimary, classes.fullWidth);

  function getActionBar () {
    return (
      <Grid container style={{ marginTop: '1rem' }}>
        <Grid item xs={12} justify="flex-end" container>
          {actionBarActions.map((action) => {
            const { prototype, onClick, id, openLabel } = action;
            const isAddNew = action.id === 'addNew';
            const className = !isAddNew ? classes.button : addNewClass;
            const gridProps = !isAddNew ? { xs: 3, justify: 'flex-end' } : { md: 1, xs: 3 };
            return (
              <Grid item key={action.id} {...gridProps} container>
                {prototype && React.cloneElement(prototype, { key: id, onClick, className })}
                {!prototype && (
                  <Button key={action.id} onClick={action.onClick} className={className}>
                    {openLabel}
                  </Button>
                )}
              </Grid>
            );
          })}
        </Grid>
      </Grid>
    );
  }

  return (
    <div>
      {getActionBar()}
    </div>
  );
}

ActionBar.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  sidebarActions: PropTypes.arrayOf(PropTypes.element),
  appEnabled: PropTypes.bool.isRequired,
};

ActionBar.defaultProps = {
  sidebarActions: [],
};

export default ActionBar;
