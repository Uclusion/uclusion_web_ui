import React from 'react';
import {
  AppBar, makeStyles, Toolbar, Typography,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import { SECTION_TYPE_PRIMARY, SECTION_TYPE_PRIMARY_WARNING } from '../../constants/global'
import { pink } from '@material-ui/core/colors'

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
    primarySubHeaderWarning: {
      boxShadow: 'none',
      background: '#fff',
      color: pink[500],
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
    grow: {
      flexGrow: 1,
    },
    headerTitle: {
      fontSize: 18,
      lineHeight: 1,
      cursor: 'default',
    },
    headerPrimaryTitle: {
      fontSize: 18,
      lineHeight: '18px',
      cursor: 'default',
    },
    toolbar: theme.mixins.toolbar,
  };
});

function SubSection(props) {
  const {
    children,
    hidden,
    title,
    actionButton,
    type,
    titleIcon,
    id,
  } = props;

  const classes = useStyles();

  return (
    <React.Fragment>
      <AppBar
        id={id}
        className={type === SECTION_TYPE_PRIMARY || type === SECTION_TYPE_PRIMARY_WARNING ? classes.primarySubHeader
          : classes.secondarySubHeader}
        position="static"
        hidden={hidden}
      >
        <Toolbar>
          {titleIcon}
          <Typography className={type === SECTION_TYPE_PRIMARY ? classes.headerPrimaryTitle
            : type === SECTION_TYPE_PRIMARY_WARNING ? classes.primarySubHeaderWarning : classes.headerTitle}>
            {title}
          </Typography>
          <div className={classes.grow}/>
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
  titleIcon: PropTypes.element,
  id: PropTypes.string,
};

SubSection.defaultProps = {
  title: '',
  hidden: false,
  children: undefined,
  type: SECTION_TYPE_PRIMARY,
  titleIcon: undefined,
  id: undefined,
};

export default SubSection;
