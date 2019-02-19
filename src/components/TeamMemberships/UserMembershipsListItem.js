import React from 'react';
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

class UserMembershipsListItem extends React.PureComponent {
  render() {
    const { team, classes, width } = this.props;
    const {
      id,
      name,
      description,
      num_users: numUsers,
    } = team;
    const isMobile = (width === 'xs');

    return (
      <ExpansionPanel>
        <ExpansionPanelSummary>
          <div className={classes.summary}>
            <Typography variant="title" paragraph>
              {name}
            </Typography>
            <Typography>
              {description}
            </Typography>
            {isMobile && (
              <Button
                className={classes.expandButtonMobile}
                color="primary"
                size="medium"
              >
                {`View all ${numUsers} members`}
              </Button>
            )}
          </div>
          {!isMobile && (
            <Button
              className={classes.expandButton}
              color="primary"
              size="medium"
            >
              {`View all ${numUsers} members`}
            </Button>
          )}
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <MemberList teamId={id} />
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }
}

UserMembershipsListItem.propTypes = {
  team: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    num_users: PropTypes.number,
  }).isRequired,
};

export default injectIntl(withWidth()(withStyles(styles)(UserMembershipsListItem)));
