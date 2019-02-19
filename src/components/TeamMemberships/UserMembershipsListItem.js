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
  const [teamSize, setTeamSize] = useState(undefined);
  const [teamSharedAmount, setTeamSharedAmount] = useState(undefined);
  const { team, classes, width } = props;
  const {
    id,
    name,
    description,
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
          {teamSize
          && (
          <Typography>
            Team size:
            {' '}
            {teamSize}
          </Typography>
          )}
          {teamSharedAmount
          && (
            <Typography>
              Team shared uShares:
              {' '}
              {teamSharedAmount}
            </Typography>
          )}
          {isMobile && (
            <Button
              className={classes.expandButtonMobile}
              color="primary"
              size="medium"
            >
              {'View all members'}
            </Button>
          )}
        </div>
        {!isMobile && (
          <Button
            className={classes.expandButton}
            color="primary"
            size="medium"
          >
            {'View all members'}
          </Button>
        )}
      </ExpansionPanelSummary>
      <ExpansionPanelDetails>
        <MemberList teamId={id} teamShared={setTeamSharedAmount} teamSize={setTeamSize} />
      </ExpansionPanelDetails>
    </ExpansionPanel>
  );
}

UserMembershipsListItem.propTypes = {
  team: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
  }).isRequired,
  classes: PropTypes.object.isRequired,
  width: PropTypes.string.isRequired,
};

export default injectIntl(withWidth()(withStyles(styles)(UserMembershipsListItem)));
