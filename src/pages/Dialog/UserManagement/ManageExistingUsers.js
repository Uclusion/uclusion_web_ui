import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import {
  addPresenceToMarket,
  getMarketPresences
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction, Checkbox, ListItemIcon, Tooltip
} from '@material-ui/core'
import BanUserButton from './BanUserButton';
import UnBanUserButton from './UnBanUserButton';
import { makeStyles } from '@material-ui/styles';
import Gravatar from '../../../components/Avatars/Gravatar';
import Typography from '@material-ui/core/Typography'
import { useIntl } from 'react-intl'
import { guestUser, unGuestUser } from '../../../api/users'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { getMarketInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import {
  getAcceptedStage, getBlockedStage,
  getInCurrentVotingStage, getInReviewStage, getRequiredInputStage, getVerifiedStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'

const useStyles = makeStyles((theme) => {
  return {
    unbanned: {},
    banned: {
      color: "#ca2828",
    },
  };
});

function ManageExistingUsers (props) {

  const {
    market
  } = props;

  const {
    id: marketId
  } = market;
  const classes = useStyles();
  const intl = useIntl();
  const [marketPresencesState, presenceDispatch] = useContext(MarketPresencesContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const yourPresence = marketPresences.find((presence) => presence.current_user) || {};
  const { is_admin: isAdmin } = yourPresence;
  const [marketStagesState] = useContext(MarketStagesContext);
  const acceptedStage = getAcceptedStage(marketStagesState, marketId) || {};
  const inDialogStage = getInCurrentVotingStage(marketStagesState, marketId) || {};
  const inReviewStage = getInReviewStage(marketStagesState, marketId) || {};
  const inBlockingStage = getBlockedStage(marketStagesState, marketId) || {};
  const requiresInputStage = getRequiredInputStage(marketStagesState, marketId) || {};
  const [investiblesState] = useContext(InvestiblesContext);
  const investibles = getMarketInvestibles(investiblesState, marketId);
  const assignedInvestibles = investibles.filter((investible) => {
    const { market_infos: marketInfos } = investible;
    const marketInfo = marketInfos.find(info => info.market_id === marketId) || {};
    return [acceptedStage.id, inDialogStage.id, inReviewStage.id, requiresInputStage.id,
      inBlockingStage.id].includes(marketInfo.stage);
  }) || [];

  function assignableChanged(guestPromise) {
    setOperationRunning(true);
    return guestPromise.then((response) => {
      const { user_id: userId, market_guest: isGuest} = response;
      setOperationRunning(false);
      const presence = marketPresences.find((presence) => presence.id = userId);
      presence.market_guest = isGuest;
      addPresenceToMarket(presenceDispatch, marketId, presence);
    });
  }

  function getUsers () {
    return marketPresences.map((presence) => {
      const { name, email, id, market_banned: banned, market_guest: guest } = presence;
      const hasStories = !_.isEmpty(assignedInvestibles.find((investible) => {
        const { market_infos: marketInfos } = investible;
        const marketInfo = marketInfos.find(info => info.market_id === marketId) || {};
        return marketInfo.assigned && marketInfo.assigned.includes(id);
      }));
      return (
        <ListItem
          key={id}
        >
          <ListItemAvatar>
            <Gravatar
              name={name}
              email={email}
              className={banned? classes.banned : classes.unbanned}
            />
          </ListItemAvatar>
          <ListItemText
            className={banned? classes.banned : classes.unbanned}
          >
            {name}
          </ListItemText>
          <ListItemIcon style={{paddingRight: '15%'}}>
            <Tooltip
              title={intl.formatMessage({ id: 'guestExplanation' })}
            >
              <Checkbox
                onChange={() => {
                  if (guest) {
                    return assignableChanged(unGuestUser(marketId, id));
                  }
                  return assignableChanged(guestUser(marketId, id));
                }}
                checked={!guest}
                disabled={banned || operationRunning || hasStories}
              />
            </Tooltip>
          </ListItemIcon>
          <ListItemSecondaryAction>
            {!banned && (
              <BanUserButton
                userId={id}
                marketId={marketId}
              />
            )}
            {banned && (
              <UnBanUserButton
                userId={id}
                marketId={marketId}
              />
            )}
          </ListItemSecondaryAction>
        </ListItem>
      );
    });
  }

  if (_.isEmpty(marketPresences) || !isAdmin){
    return <React.Fragment/>
  }

  return (
    <List subheader={
      <Typography align="center" variant="h6">
        {intl.formatMessage({ id: 'manage' })}
      </Typography>
    }>
      <ListItem key='header'><ListItemText />
        <Tooltip title={intl.formatMessage({ id: 'cannotUnassignExplanation' })}>
          <ListItemIcon style={{paddingRight: '7%'}}>Assignable</ListItemIcon>
        </Tooltip>
        <Tooltip title={intl.formatMessage({ id: 'removeExplanation' })}>
          <ListItemIcon>Remove</ListItemIcon>
        </Tooltip>
      </ListItem>
      {getUsers()}
    </List>
  );

}

ManageExistingUsers.propTypes = {
  market: PropTypes.object.isRequired,
};

export default ManageExistingUsers;