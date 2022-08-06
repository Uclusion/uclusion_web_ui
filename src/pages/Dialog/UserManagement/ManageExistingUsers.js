import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import {
  getGroupPresences,
  getMarketPresences
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction, ListItemIcon, Tooltip
} from '@material-ui/core'
import BanUserButton from './BanUserButton';
import { makeStyles } from '@material-ui/styles';
import Gravatar from '../../../components/Avatars/Gravatar';
import Typography from '@material-ui/core/Typography'
import { useIntl } from 'react-intl'
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext'

const useStyles = makeStyles((theme) => {
  return {
    manage: {
      width: '75%',
      [theme.breakpoints.down('sm')]: {
        width: 'unset'
      },
    },
  };
});

function ManageExistingUsers (props) {
  const { group } = props;
  const { market_id: marketId, id } = group;
  const classes = useStyles();
  const intl = useIntl();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const groupPresences = getGroupPresences(marketPresences, groupPresencesState, marketId, id) || [];
  const yourPresence = marketPresences.find((presence) => presence.current_user) || {};
  const { is_admin: isAdmin } = yourPresence;

  function getUsers () {
    return groupPresences.map((presence) => {
      const { name, email, id } = presence;
      return (
        <ListItem
          key={id}
        >
          <ListItemAvatar>
            <Gravatar
              name={name}
              email={email}
            />
          </ListItemAvatar>
          <ListItemText
          >
            {name}
          </ListItemText>
          <ListItemSecondaryAction>
            <BanUserButton
              userId={id}
              marketId={marketId}
            />
          </ListItemSecondaryAction>
        </ListItem>
      );
    });
  }

  if (_.isEmpty(groupPresences) || !isAdmin){
    return <React.Fragment/>
  }

  return (
    <List className={classes.manage}
      subheader={
      <Typography align="center" variant="h6">
        {intl.formatMessage({ id: 'manage' })}
      </Typography>
    }>
      <ListItem key='header'><ListItemText />
        <Tooltip title={intl.formatMessage({ id: 'removeExplanation' })}>
          <ListItemIcon>Remove</ListItemIcon>
        </Tooltip>
      </ListItem>
      {getUsers()}
    </List>
  );

}

ManageExistingUsers.propTypes = {
  group: PropTypes.object.isRequired,
};

export default ManageExistingUsers;