import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import {
  List,
  ListItem,
  Avatar,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from '@material-ui/core';
import { nameToAvatarText } from '../../../utils/stringFunctions';
import BanUserButton from './BanUserButton';
import UnBanUserButton from './UnBanUserButton';
import { makeStyles } from '@material-ui/styles';
import md5 from 'md5'

const useStyles = makeStyles((theme) => {
  return {
    unbanned: {},
    banned: {
      color: "#ca2828",
    },
  };
});

function ExistingUsers (props) {

  const {
    market
  } = props;

  const {
    id: marketId
  } = market;
  const classes = useStyles();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const yourPresence = marketPresences.find((presence) => presence.current_user) || {};
  const withoutYou = marketPresences.filter((presence) => !presence.current_user);
  const { is_admin: isAdmin } = yourPresence;

  function getUsers () {
    return withoutYou.map((presence) => {
      const { name, email, id, market_banned: banned } = presence;
      return (
        <ListItem
          key={id}
        >
          <ListItemAvatar>
            <Avatar
              className={banned? classes.banned : classes.unbanned}
              src={`https://www.gravatar.com/avatar/${md5(email, {encoding: "binary"})}?d=404`}
            >
              {nameToAvatarText(name)}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            className={banned? classes.banned : classes.unbanned}
          >
            {name}
          </ListItemText>
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

  if (_.isEmpty(withoutYou) || !isAdmin){
    return <React.Fragment/>
  }

  return (
    <List>
      {getUsers()}
    </List>
  );

}

ExistingUsers.propTypes = {
  market: PropTypes.object.isRequired,
};

export default ExistingUsers;