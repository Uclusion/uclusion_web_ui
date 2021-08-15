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
  ListItemSecondaryAction, Checkbox, ListItemIcon
} from '@material-ui/core'
import BanUserButton from './BanUserButton';
import UnBanUserButton from './UnBanUserButton';
import { makeStyles } from '@material-ui/styles';
import Gravatar from '../../../components/Avatars/Gravatar';
import Typography from '@material-ui/core/Typography'
import { useIntl } from 'react-intl'
import { guestUser, unGuestUser } from '../../../api/users'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'

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
            <Checkbox
              onChange={() => {
                if (guest) {
                  return assignableChanged(unGuestUser(marketId, id));
                }
                return assignableChanged(guestUser(marketId, id));
              }}
              checked={!guest}
              disabled={banned || operationRunning}
            />
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
        <ListItemIcon style={{paddingRight: '7%'}}>Assignable</ListItemIcon>
        <ListItemIcon>Remove</ListItemIcon>
      </ListItem>
      {getUsers()}
    </List>
  );

}

ManageExistingUsers.propTypes = {
  market: PropTypes.object.isRequired,
};

export default ManageExistingUsers;