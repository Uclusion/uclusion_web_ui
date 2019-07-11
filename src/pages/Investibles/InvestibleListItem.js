import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { injectIntl } from 'react-intl';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import {
  Paper,
  Typography,
} from '@material-ui/core';

const styles = theme => ({
  card: {
    marginBottom: theme.spacing.unit,
    padding: theme.spacing.unit * 1.5,
    boxShadow: 'none',
    '&:last-child': {
      marginBottom: 0,
    },
  },
  cardSelected: {
    boxShadow: '0 0 5px blue',
  },
  link: {
    textDecoration: 'none',
  },
  flex: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  row: {
    marginBottom: theme.spacing.unit,
    '&:last-child': {
      marginBottom: 0,
    },
  },
  investibleName: {
    marginBottom: theme.spacing.unit,
    cursor: 'pointer',
    wordWrap: 'break-word',
  },
  stageLabel: {
    minWidth: 100,
  },
  stageContent: {
    flex: 1,
  },
  numSharesText: {
    fontSize: 12,
  },
});

class InvestibleListItem extends React.PureComponent {



  render() {
    const {
      classes,
      intl,
      investible,
      selected,
    } = this.props;

    return (
      <Paper square={true} className={classNames(classes.card, { [classes.cardSelected]: selected })}>
        <Link className={classes.link} to={`#investible:${investible.id}`}>
          <Typography component="div">
            <div className={classes.flex}>
              <div className={classes.investibleName}>{investible.name}</div>
            </div>
          </Typography>
        </Link>
      </Paper>
    );
  }
}

InvestibleListItem.propTypes = {
  classes: PropTypes.object.isRequired, //eslint-disable-line
  intl: PropTypes.object.isRequired, //eslint-disable-line
  investible: PropTypes.object.isRequired, //eslint-disable-line
  selected: PropTypes.bool, //eslint-disable-line
};

export default injectIntl(withStyles(styles)(InvestibleListItem));
