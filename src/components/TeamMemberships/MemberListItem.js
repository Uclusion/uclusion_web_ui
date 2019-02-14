import PropTypes from 'prop-types';
import React from 'react';
import { ExpansionPanel, ExpansionPanelSummary, Typography } from '@material-ui/core';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';


const styles = theme => ({
  headerBox: {
    display: 'flex',
    justifyContent: 'space-between',
  },

  details: {
    alignItems: 'center',
  },

  helper: {},

  investment: {
    display: 'inline-block',
  },

  column: {
    flexBasis: '33.33%',
  },

  mainGrid: {
    padding: theme.spacing.unit * 2,
    justifyContent: 'flex-end',
  },

  tabSection: {
    borderTop: `1px solid ${theme.palette.divider}`,
    display: 'block',
  },

  wholeWidth: {
    flexBasis: '100%',
  },
});

class MemberListItem extends React.PureComponent {
  render() {
    const { name, classes } = this.props;
    // for now, don't bother rendering the TEAM user
    return (
      <ExpansionPanel>
        <ExpansionPanelSummary>
          <div className={classes.column}>
            <Typography>
              {name}
            </Typography>
          </div>
          <div className={classes.column} />
          <div className={classNames(classes.column, classes.helper)} />
        </ExpansionPanelSummary>
      </ExpansionPanel>
    );
  }
}

MemberListItem.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string,
  type: PropTypes.string.isRequired,
};


export default injectIntl(withStyles(styles)(MemberListItem));
