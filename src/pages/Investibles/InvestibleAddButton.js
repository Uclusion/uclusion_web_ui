import React from 'react';
import { connect } from 'react-redux';
import { IconButton, Tooltip, withStyles } from '@material-ui/core';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { formCurrentMarketLink } from '../../utils/marketIdPathFunctions';
import { Add } from '@material-ui/icons';
import { Link } from 'react-router-dom';

const styles = theme => ({
  root: {
    color: 'inherit',
  },
});

function InvestibleAddButton (props) {

  const { intl, classes } = props;

  return (
    <Link to={formCurrentMarketLink('investibleAdd')} className={classes.root}>
      <Tooltip title={intl.formatMessage({ id: 'investiblesAddTooltip' })}>
        <IconButton color={'inherit'}>
          <Add/>
        </IconButton>
      </Tooltip>
    </Link>
  );
}

InvestibleAddButton.propTypes = {
  intl: PropTypes.object, //eslint-disable-line
  classes: PropTypes.object, //eslint-disable-line
};

export default withStyles(styles)(injectIntl(InvestibleAddButton));
