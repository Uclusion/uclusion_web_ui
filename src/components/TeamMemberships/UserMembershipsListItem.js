/* eslint-disable react/forbid-prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import {
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  Typography,
  Button,
  Badge,
  Chip,
} from '@material-ui/core';
import withWidth from '@material-ui/core/withWidth';
import { withStyles } from '@material-ui/core/styles';
import moment from 'moment';
import { injectIntl } from 'react-intl';
import MemberList from './MemberList';

const styles = theme => ({
  summary: {
    flex: 1,
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
  },
  titleText: {
    margin: 0,
    maxWidth: '50%',
  },
  investiblesLabel: {
    marginLeft: theme.spacing.unit * 8,
    marginRight: theme.spacing.unit * 2,
  },
  investiblesBadge: {
    marginLeft: theme.spacing.unit * 3,
  },
  lastInvestmentDate: {
    color: theme.palette.grey[600],
    marginBottom: theme.spacing.unit * 2,
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
  const {
    team,
    investibles,
    classes,
    width,
  } = props;
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
  const lastInvestDate = moment(last_investment_updated_at).format('MM/DD/YYYY hh:mm A');

  return (
    <ExpansionPanel CollapseProps={{ unmountOnExit: true }}>
      <ExpansionPanelSummary>
        <div className={classes.summary}>
          <div className={classes.title}>
            <Typography className={classes.titleText} variant="h6" paragraph>
              {name}
            </Typography>
            <Typography className={classes.investiblesLabel}>uShares:</Typography>
            <Badge
              max={1000000}
              badgeContent={shared_quantity}
              color="primary"
            >
              <Chip
                label="Shared"
                variant="outlined"
              />
            </Badge>
            <Badge
              className={classes.investiblesBadge}
              max={1000000}
              badgeContent={quantity}
              color="primary"
            >
              <Chip
                label="Available"
                variant="outlined"
              />
            </Badge>
            <Badge
              className={classes.investiblesBadge}
              max={1000000}
              badgeContent={quantity_invested}
              color="primary"
            >
              <Chip
                label="Invested"
                variant="outlined"
              />
            </Badge>
          </div>
          {last_investment_updated_at && (
            <Typography className={classes.lastInvestmentDate}>
              {'Last invested at:  '}
              {lastInvestDate}
            </Typography>
          )}
          <Typography>
            {description}
          </Typography>
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
        <MemberList investibles={investibles} teamId={id} />
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
  investibles: PropTypes.arrayOf(PropTypes.object),
  classes: PropTypes.object.isRequired,
  width: PropTypes.string.isRequired,
};

export default injectIntl(withWidth()(withStyles(styles)(UserMembershipsListItem)));
