/* eslint-disable react/forbid-prop-types */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core';
import Activity from '../../containers/Activity/Activity';
import { withUserAndPermissions } from '../../components/UserPermissions/UserPermissions';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import { withMarketId } from '../../components/PathProps/MarketId';
import TeamAdd from '../../components/Invite/TeamAdd';
import InviteList from '../../components/Invite/InviteList';
import AdminAdd from '../../components/Invite/AdminAdd';
import Typography from '@material-ui/core/Typography';
import HelpMovie from '../../components/ModalMovie/HelpMovie';

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
    userPermissions,
    upUser,
    marketId,
    classes,
  } = props;
  const { canListAccountTeams, canInvest } = userPermissions;

  useEffect(() => {
    const clientPromise = getClient();
    if (canListAccountTeams) {
      clientPromise.then(client => client.teams.list(marketId)).then((marketTeams) => {
        setTeams(marketTeams.filter(team => !('external_id' in team)));
      }).catch((error) => {
        console.log(error);
        sendIntlMessage(ERROR, { id: 'teamsLoadFailed' });
      });
    } else if (canInvest) {
      clientPromise.then(client => client.teams.mine(marketId)).then((marketTeams) => {
        setTeams(marketTeams.filter(team => !('external_id' in team)));
      }).catch((error) => {
        console.log(error);
        sendIntlMessage(ERROR, { id: 'teamsLoadFailed' });
      });
    }
    return () => {};
  }, [marketId, canListAccountTeams, canInvest]);

  return (
    <Activity
      isLoading={teams === undefined}
      containerStyle={{ overflow: 'hidden' }}
      title={intl.formatMessage({ id: 'inviteMenu' })}
    >
      <div className={classes.content}>
        {canListAccountTeams && (<HelpMovie name="inviteAdminIntro" />)}
        {canInvest && (<HelpMovie name="inviteUserIntro" />)}
        {canListAccountTeams && (
          <Typography variant="h5" className={classes.directions}>
            {intl.formatMessage({ id: 'inviteMarketText' })}
          </Typography>
        )}
        {canListAccountTeams && (
          <TeamAdd marketId={marketId} teams={teams} teamsSet={setTeams} />
        )}
        {canListAccountTeams && (
          <AdminAdd upUser={upUser} />
        )}
        <InviteList teams={teams} />
      </div>
    </Activity>
  );
}

Invite.propTypes = {
  userPermissions: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  intl: PropTypes.object.isRequired,
};

export default injectIntl(withUserAndPermissions(withMarketId(withStyles(styles)(Invite))));
