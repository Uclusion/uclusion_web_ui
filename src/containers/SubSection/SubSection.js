import React from 'react'
import { AppBar, makeStyles, Toolbar, Typography, } from '@material-ui/core'
import PropTypes from 'prop-types'
import { pink } from '@material-ui/core/colors'
import { SECTION_TYPE_SECONDARY } from '../../constants/global'

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
    },
    grow: {
      flexGrow: 1,
    },
    headerTitle: {
      fontSize: 16,
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
    // eslint-disable-next-line no-unused-vars
    type,
    titleIcon,
    id,
  } = props;

  const classes = useStyles();

  return (
    <React.Fragment>
      <AppBar
        id={id}
        className={classes.secondarySubHeader}
        position="static"
        hidden={hidden}
      >
        <Toolbar variant="dense">
          {titleIcon}
          <Typography className={classes.headerTitle}>
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
  children: PropTypes.any,
  actionButton: PropTypes.object,
  type: PropTypes.string,
  titleIcon: PropTypes.element,
  id: PropTypes.string,
};

SubSection.defaultProps = {
  title: '',
  hidden: false,
  children: undefined,
  type: SECTION_TYPE_SECONDARY,
  titleIcon: undefined,
  id: undefined,
};

export default SubSection;
