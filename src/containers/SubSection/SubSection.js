import React from 'react';
import { AppBar, Card, Link, makeStyles, Toolbar, Typography, } from '@material-ui/core'
import PropTypes from 'prop-types';
import {
  SECTION_SUB_HEADER,
  SECTION_TYPE_SECONDARY,
  SECTION_TYPE_SECONDARY_WARNING,
  SECTION_TYPE_TERTIARY_WARNING
} from '../../constants/global';

const useStyles = makeStyles((theme) => {
  return {
    hide: {
      display: 'none'
    },
    childContainer: {
    },
    paddedChildContainer: {
      padding: '1rem',
    },
    secondarySubHeaderWarning: {
      boxShadow: 'none',
      background: theme.palette.grey['100'],
      color: 'black',
      borderRadius: '6px 6px 0 0'
    },
    subHeaderWarning: {
      boxShadow: 'none',
      background: theme.palette.grey['100'],
      color: 'black',
      borderRadius: '6px 6px 0 0'
    },
    tertiarySubHeaderWarning: {
      boxShadow: 'none',
      background: theme.palette.grey['100'],
      color: 'black',
      borderRadius: '6px 6px 0 0'
    },
    secondarySubHeader: {
      boxShadow: 'none',
      background: theme.palette.grey['100'],
      color: 'black',
    },
    sectionSubHeader: {
      boxShadow: 'none',
      background: 'white',
      color: '#F29100',
      borderRadius: '6px 6px 0 0'
    },
    sectionSubHeaderBlack: {
      boxShadow: 'none',
      color: 'black',
      background: theme.palette.grey['100'],
      borderRadius: '6px 6px 0 0'
    },
    grow: {
      flexGrow: 1,
    },
    headerTitle: {
      fontSize: 16,
      lineHeight: 1,
      cursor: 'default',
      whiteSpace: 'nowrap'
    },
    headerTitleBolder: {
      fontSize: 16,
      lineHeight: 1,
      cursor: 'default',
      fontWeight: 'bolder',
      whiteSpace: 'nowrap'
    },
    headerPrimaryTitle: {
      fontSize: 18,
      lineHeight: '18px',
      cursor: 'default',
    },
    toolbar: theme.mixins.toolbar,
    searchContainer: {
      display: 'flex',
      [theme.breakpoints.down('xs')]: {
        flexDirection: 'column'
      }
    },
  };
});

function SubSection (props) {
  const {
    children,
    hidden,
    title,
    actionButton,
    createButton,
    searchBar,
    type,
    titleIcon,
    id,
    helpLink,
    bolder,
    hideChildren,
    padChildren,
    isBlackText
  } = props;
  const classes = useStyles();

  return (
    <React.Fragment>
      <AppBar
        id={id}
        className={type === SECTION_TYPE_SECONDARY ? classes.secondarySubHeader :
          type === SECTION_TYPE_SECONDARY_WARNING ? classes.secondarySubHeaderWarning :
            type === SECTION_TYPE_TERTIARY_WARNING ? classes.tertiarySubHeaderWarning :
              type === SECTION_SUB_HEADER ? isBlackText ? classes.sectionSubHeaderBlack : classes.sectionSubHeader
                : classes.subHeaderWarning}
        position="static"
        hidden={hidden}
      >
        <Toolbar variant="dense">
          {titleIcon}
          {helpLink && (
            <Link href={helpLink} target="_blank" variant='body1' style={{lineHeight: 0, color: '#2D9CDB'}}>
              <Typography className={bolder ? classes.headerTitleBolder : classes.headerTitle}>
                {title}
              </Typography>
            </Link>
          )}
          {!helpLink && (
            <Typography className={classes.headerTitle}>
              {title}
            </Typography>
          )}
          <div className={classes.grow}/>
          <div className={classes.searchContainer}>
            {createButton}
            {searchBar}
            {actionButton}
          </div>
        </Toolbar>
      </AppBar>
      <div className={children && !hideChildren ? classes.toolbar : classes.hide} id={`${id}Children`}>
        <Card className={padChildren ? classes.paddedChildContainer : classes.childContainer}>
          {children}
        </Card>
      </div>
    </React.Fragment>

  );
}

SubSection.propTypes = {
  hidden: PropTypes.bool,
  title: PropTypes.string,
  children: PropTypes.any,
  actionButton: PropTypes.object,
  createButton: PropTypes.object,
  searchBar: PropTypes.object,
  type: PropTypes.string,
  titleIcon: PropTypes.element,
  id: PropTypes.string,
  bolder: PropTypes.bool,
  hideChildren: PropTypes.bool,
  padChildren: PropTypes.bool,
};

SubSection.defaultProps = {
  title: '',
  hidden: false,
  hideChildren: false,
  children: undefined,
  type: SECTION_TYPE_SECONDARY,
  titleIcon: undefined,
  id: undefined,
  bolder: false,
  padChildren: false,
};

export default SubSection;
