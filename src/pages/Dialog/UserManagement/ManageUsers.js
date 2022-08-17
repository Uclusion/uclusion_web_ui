import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { CardContent, useMediaQuery, useTheme } from '@material-ui/core'
import AddNewUsers from './AddNewUsers'
import _ from 'lodash'
import { SettingsBackupRestore } from '@material-ui/icons'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import { useIntl } from 'react-intl'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { changeGroupParticipation } from '../../../api/markets'
import { addGroupMembers } from '../../../contexts/GroupMembersContext/groupMembersContextReducer'
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext'
import CardActions from '@material-ui/core/CardActions'

function ManageUsers(props) {
  const {
    market, isInbox, name, group
  } = props;
  const intl = useIntl();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [checked, setChecked] = useState([]);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [, groupPresencesDispatch] = useContext(GroupMembersContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const marketPresences = getMarketPresences(marketPresencesState, market.id) || [];
  const isAddGroup = !_.isEmpty(group);

  function handleSaveParticipants() {
    const added = checked.map((added) => {
      const found = marketPresences.find((presence) => presence.external_id === added.external_id);
      return {user_id: found.id, is_following: true};
    });
    return changeGroupParticipation(market.id, group.id, added).then((newUsers) => {
        setOperationRunning(false);
        groupPresencesDispatch(addGroupMembers(group.id, newUsers));
      });
  }

  return (
    <>
      {isAddGroup && (
        <CardActions style={{paddingTop: '2rem', paddingLeft: '1rem'}}>
          <SpinningIconLabelButton onClick={handleSaveParticipants} icon={SettingsBackupRestore}
                                   id="participantAddButton"
                                   disabled={_.isEmpty(checked)}>
            {intl.formatMessage({ id: mobileLayout ? 'addExistingCollaboratorMobile' :
                'addExistingCollaborator' })}
          </SpinningIconLabelButton>
        </CardActions>
      )}
      <CardContent>
        <AddNewUsers market={market} isInbox={isInbox} name={name} group={group} isAddToGroup={isAddGroup}
                     setToAddClean={(value) => setChecked(value)} />
      </CardContent>
    </>
  );
}

ManageUsers.propTypes = {
  market: PropTypes.object.isRequired,
  onAddNewUsers: PropTypes.func,
};

ManageUsers.defaultProps = {
  onAddNewUsers: () => {}
};

export default ManageUsers;