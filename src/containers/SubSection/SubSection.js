import React from 'react'
import { AppBar, makeStyles, Toolbar, Tooltip, Typography, } from '@material-ui/core'
import PropTypes from 'prop-types'
import {
  SECTION_TYPE_SECONDARY,
  SECTION_TYPE_SECONDARY_WARNING,
  SECTION_TYPE_TERTIARY_WARNING
} from '../../constants/global'
import { useIntl } from 'react-intl'

const useStyles = makeStyles((theme) => {
  return {
    hide: {
      display: 'none'
    },
    secondarySubHeaderWarning: {
      boxShadow: 'none',
      background: '#D54F22',
      color: '#fff',
    },
    subHeaderWarning: {
      boxShadow: 'none',
      background: '#e6e969',
      color: 'black',
    },
    tertiarySubHeaderWarning: {
      boxShadow: 'none',
      background: '#2F80ED',
      color: '#fff',
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
      whiteSpace: 'nowrap'
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
    helpTextId
  } = props;
  const intl = useIntl();
  const classes = useStyles();

  return (
    <React.Fragment>
      <AppBar
        id={id}
        className={type === SECTION_TYPE_SECONDARY ? classes.secondarySubHeader :
          type === SECTION_TYPE_SECONDARY_WARNING ? classes.secondarySubHeaderWarning :
            type === SECTION_TYPE_TERTIARY_WARNING ? classes.tertiarySubHeaderWarning : classes.subHeaderWarning}
        position="static"
        hidden={hidden}
      >
        <Toolbar variant="dense">
          {titleIcon}
          {helpTextId && (
            <Tooltip
              title={intl.formatMessage({ id: helpTextId })}
            >
              <Typography className={classes.headerTitle}>
                {title}
              </Typography>
            </Tooltip>
          )}
          {!helpTextId && (
            <Typography className={classes.headerTitle}>
              {title}
            </Typography>
          )}
          <div className={classes.grow}/>
          {actionButton}
        </Toolbar>
      </AppBar>
      <div className={children ? classes.toolbar : classes.hide}>
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
