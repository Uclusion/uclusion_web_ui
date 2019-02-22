/* eslint-disable react/forbid-prop-types */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  Typography,
  Button,
} from '@material-ui/core';
import withWidth from '@material-ui/core/withWidth';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import MemberList from './MemberList';

const styles = theme => ({
  summary: {
    flex: 1,
  },
  expandButton: {
    alignSelf: 'center',
    paddingRight: `${theme.spacing.unit}px !important`,
  },
  expandButtonMobile: {
    padding: '0px !important',
    marginTop: theme.spacing.unit * 2,
  },
});

function UserMembershipsListItem(props) {
  const { team, classes, width } = props;
  const {
    id,
    name,
    description,
    shared_quantity,
    team_size,
    quantity_invested,
    quantity,
    last_investment_updated_at,
  } = team;
  const isMobile = (width === 'xs');

  return (
    <ExpansionPanel CollapseProps={{ unmountOnExit: true }}>
      <ExpansionPanelSummary>
        <div className={classes.summary}>
          <Typography variant="h6" paragraph>
            {name}
          </Typography>
          <Typography>
            {description}
          </Typography>
          <Typography>
            Team shared uShares:
            {' '}
            {shared_quantity}
          </Typography>
          <Typography>
            Team unspent uShares:
            {' '}
            {quantity}
          </Typography>
          <Typography>
            Team invested uShares:
            {' '}
            {quantity_invested}
          </Typography>
          {last_investment_updated_at
          && (
            <Typography>
              Team last investment:
              {' '}
              {last_investment_updated_at}
            </Typography>
          )}
          {isMobile && (
            <Button
              className={classes.expandButtonMobile}
              color="primary"
              size="medium"
            >
                {`View all ${team_size} members`}
            </Button>
          )}
        </div>
        {!isMobile && (
          <Button
            className={classes.expandButton}
            color="primary"
            size="medium"
          >
              {`View all ${team_size} members`}
          </Button>
        )}
      </ExpansionPanelSummary>
      <ExpansionPanelDetails>
        <MemberList teamId={id} />
      </ExpansionPanelDetails>
    </ExpansionPanel>
  );
}

UserMembershipsListItem.propTypes = {
  team: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    team_size: PropTypes.number,
    shared_amount: PropTypes.number,
  }).isRequired,
  classes: PropTypes.object.isRequired,
  width: PropTypes.string.isRequired,
};

export default injectIntl(withWidth()(withStyles(styles)(UserMembershipsListItem)));
