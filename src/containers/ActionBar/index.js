import React, { useState } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { Button, Menu, MenuItem, Grid, darken } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'

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
    backgroundColor: '#e0e0e0'
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

function ActionBar(props) {
  const classes = useStyles();
  const { actionBarActions } = props;
  const [anchorEl, setAnchorEl] = useState(null);

  const recordPositionToggle = (event) => {
    if(anchorEl === null){
      setAnchorEl(event.currentTarget);
    } else {
      setAnchorEl(null)
    }
  };

  function getActionBar() {
    const archive = actionBarActions.filter(action => {return action.id === 'archive'});
    const actions = actionBarActions.filter(action => {return action.id !== 'archive'});
    return (
      
      <Grid container style={{marginTop:'8rem'}}>
        <Grid item xs={12} justify="flex-end" container>
          <Grid item xs={3} container justify="flex-end">
            {archive && archive.length > 0 &&
              <Button onClick={archive[0].onClick} className={classes.button}>
                {archive[0].openLabel}
              </Button>
            }
          </Grid>
          <Grid item xs={1}>
            {actions && actions.length > 0 &&
              <Button onClick={recordPositionToggle} className={clsx(
                classes.button,
                classes.buttonPrimary,
                classes.fullWidth
              )}>
                Add New
                <Menu 
                  className={classes.actionContent}
                  anchorEl={anchorEl}
                  open={!!anchorEl}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  getContentAnchorEl={null}
                  >
                  {actions.map(action => {
                    return <MenuItem key={action.id} onClick={action.onClick}>
                      <div className={classes.icon}>
                        {action.icon}
                      </div>
                        {action.openLabel}
                    </MenuItem>
                  })}
                </Menu>
              </Button>
            }
          </Grid>
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
