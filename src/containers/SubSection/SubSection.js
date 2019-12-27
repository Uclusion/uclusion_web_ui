import React from 'react';
import {
  AppBar, makeStyles, Toolbar, Typography,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import { SECTION_TYPE_PRIMARY } from '../../constants/global';

const useStyles = makeStyles((theme) => {
  return {
    primarySubHeader: {
      boxShadow: 'none',
      background: '#fff',
      color: '#323232',
      minHeight: 32,
      borderRadius: '2px',
      marginBottom: '6px',
    },
    secondarySubHeader: {
      boxShadow: 'none',
      background: '#3F6B72',
      color: '#fff',
      minHeight: 32,
      borderRadius: '2px',
      marginBottom: '6px',
    },
    headerTitle: {
      fontSize: 14,
      lineHeight: '18px',
      cursor: 'default',
    },
    toolbar: theme.mixins.toolbar,
  };
});

function SubSection(props) {
  const { children, hidden, title, actionButton } = props;

  const classes = useStyles();

  return (
    <React.Fragment>
      <AppBar
        className={props.type === SECTION_TYPE_PRIMARY ? classes.primarySubHeader : classes.secondarySubHeader}
        position="static"
        hidden={hidden}
      >
        <Toolbar>
          <Typography className={classes.headerTitle}>
            {title}
          </Typography>
          {actionButton}
        </Toolbar>
      </AppBar>
      <div className={classes.toolbar}>
        {children}
      </div>
    </React.Fragment>

  );
}

SubSection.propTypes = {
  hidden: PropTypes.bool,
  title: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  children: PropTypes.any,
  // eslint-disable-next-line react/forbid-prop-types
  actionButton: PropTypes.object,
  type: PropTypes.string,
};

SubSection.defaultProps = {
  title: '',
  hidden: false,
  children: undefined,
  type: SECTION_TYPE_PRIMARY,
};

export default SubSection;
