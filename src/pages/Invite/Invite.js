/* eslint-disable react/forbid-prop-types */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core';
import Activity from '../../containers/Activity/Activity';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import { withMarketId } from '../../components/PathProps/MarketId';
import TeamAdd from '../../components/Invite/TeamAdd';
import InviteList from '../../components/Invite/InviteList';
import AdminAdd from '../../components/Invite/AdminAdd';
import Typography from '@material-ui/core/Typography';
import HelpMovie from '../../components/ModalMovie/HelpMovie';
import { connect } from 'react-redux';
import { getCurrentUser } from '../../store/Users/reducer';
import { getFlags } from '../../utils/userFunctions'

const styles = theme => ({
  content: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  directions: {
    padding: theme.spacing.unit * 2,
  },
});

function Invite(props) {
  const [teams, setTeams] = useState([]);
  const {
    intl,
    marketId,
    classes,
    user,
  } = props;
  const { isAdmin, canInvest } = getFlags(user);

  useEffect(() => {
    const clientPromise = getClient();
    if (isAdmin) {
      clientPromise.then(client => client.teams.list()).then((marketTeams) => {
        setTeams(marketTeams.filter(team => !('external_id' in team)));
      }).catch((error) => {
        console.error(error);
        sendIntlMessage(ERROR, { id: 'teamsLoadFailed' });
      });
    } else if (canInvest) {
      clientPromise.then(client => client.teams.mine()).then((marketTeams) => {
        setTeams(marketTeams.filter(team => !('external_id' in team)));
      }).catch((error) => {
        console.error(error);
        sendIntlMessage(ERROR, { id: 'teamsLoadFailed' });
      });
    }
    return () => {};
  }, [marketId, isAdmin, canInvest]);

  return (
    <Activity
      isLoading={teams === undefined}
      containerStyle={{ overflow: 'hidden' }}
      title={intl.formatMessage({ id: 'inviteMenu' })}
    >
      <div className={classes.content}>
        {isAdmin && (<HelpMovie name="inviteAdminIntro" />)}
        {canInvest && (<HelpMovie name="inviteUserIntro" />)}
        {isAdmin && (
          <Typography variant="h5" className={classes.directions}>
            {intl.formatMessage({ id: 'inviteMarketText' })}
          </Typography>
        )}
        {isAdmin && (
          <TeamAdd marketId={marketId} teams={teams} teamsSet={setTeams} />
        )}
        {isAdmin && (
          <AdminAdd user={user} />
        )}
        <InviteList teams={teams} />
      </div>
    </Activity>
  );
}

Invite.propTypes = {
  user: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  intl: PropTypes.object.isRequired,
};

const mapStateToProps = state => ({
  user: getCurrentUser(state.usersReducer),
});

export default connect(mapStateToProps)(injectIntl(withMarketId(withStyles(styles)(Invite))));
