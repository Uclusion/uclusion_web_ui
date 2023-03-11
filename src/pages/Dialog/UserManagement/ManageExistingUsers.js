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
  ListItemSecondaryAction, ListItemIcon, Tooltip, Checkbox
} from '@material-ui/core'
import { makeStyles } from '@material-ui/styles';
import Gravatar from '../../../components/Avatars/Gravatar';
import { useIntl } from 'react-intl'
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { changeGroupParticipation } from '../../../api/markets'
import { modifyGroupMembers } from '../../../contexts/GroupMembersContext/groupMembersContextReducer'

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

function ManageExistingUsers(props) {
  const { group } = props;
  const { market_id: marketId, id } = group;
  const classes = useStyles();
  const intl = useIntl();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [groupPresencesState, groupPresencesDispatch] = useContext(GroupMembersContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const groupPresences = getGroupPresences(marketPresences, groupPresencesState, marketId, id, true) || [];
  const yourPresence = marketPresences.find((presence) => presence.current_user) || {};
  const { is_admin: isAdmin } = yourPresence;

  function followUnfollow(userId, wasRemoved) {
    setOperationRunning({userId, isFollowing: wasRemoved});
    const addressed = [{user_id: userId, is_following: wasRemoved}];
    return changeGroupParticipation(marketId, id, addressed).then((modifed) => {
      groupPresencesDispatch(modifyGroupMembers(id, modifed));
      setTimeout(() => {
        // Give the dispatch time to work
        setOperationRunning(false);
      }, 4000);
    });
  }

  function getUsers() {
    return groupPresences.map((presence) => {
      const { name, email, id, deleted } = presence;
      const { id: runningId, isFollowing } = operationRunning || {};
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
          <ListItemSecondaryAction style={{paddingRight: '1rem'}}>
            <Checkbox
              id="followingGroup"
              name="followingGroup"
              checked={runningId === id ? isFollowing : !deleted}
              onClick={() => followUnfollow(id, deleted === true)}
              disabled={operationRunning !== false}
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
    <List className={classes.manage}>
      <ListItem key='header'><ListItemText />
        <Tooltip title={intl.formatMessage({ id: 'groupRemoveExplanation' })}>
          <ListItemIcon> {intl.formatMessage({ id: 'groupRemoveAction' })}</ListItemIcon>
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