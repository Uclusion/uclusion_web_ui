import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import {
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

const useStyles = makeStyles(() => {
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
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const yourPresence = marketPresences.find((presence) => presence.current_user) || {};
  const { is_admin: isAdmin } = yourPresence;

  function getUsers () {
    return marketPresences.map((presence) => {
      const { name, email, id, market_banned: banned, following } = presence;
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
              title={intl.formatMessage({ id: 'mutedExplanation' })}
            >
              <Checkbox
                checked={!following}
                disabled={true}
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
          <ListItemIcon style={{paddingRight: '7%'}}>{intl.formatMessage({ id: 'mutedExplanation' })}
          </ListItemIcon>
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