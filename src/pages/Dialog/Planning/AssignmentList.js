import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useIntl } from 'react-intl';
import Typography from '@material-ui/core/Typography';
import IdentityList from '../../../components/Email/IdentityList';
import { getGroupPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import { Checkbox } from '@material-ui/core';
import { isEveryoneGroup } from '../../../contexts/GroupMembersContext/groupMembersHelper';

function AssignmentList(props) {
  const {
    fullMarketPresences,
    onChange,
    previouslyAssigned,
    cannotBeAssigned,
    listHeader,
    requiresInput,
    groupId,
    marketId,
    showAllOnly
  } = props;
  const [groupPresencesState] = useContext(GroupMembersContext);
  const [groupOnly, setGroupOnly] = useState(!showAllOnly);
  const [checked, setChecked] = useState(fullMarketPresences.filter((presence) =>
    previouslyAssigned.includes(presence.id)));
  const intl = useIntl();
  const marketPresencesRaw = fullMarketPresences.filter((presence) => !presence.market_banned);
  const marketPresences = groupOnly ? getGroupPresences(marketPresencesRaw, groupPresencesState, marketId, groupId)
    || [] : marketPresencesRaw;
  const useShowAllOnly = showAllOnly || isEveryoneGroup(groupId, marketId);

  function getSortedPresenceWithAssignable() {
    const assignable = _.isEmpty(cannotBeAssigned) ? marketPresences : marketPresences.filter((presence) =>
      !cannotBeAssigned.includes(presence.id));
    return _.sortBy(assignable, [((presence) => presence.current_user ? 0 : 1),
      (presence) => presence.name]);
  }

  const participants = getSortedPresenceWithAssignable();

  function mySetChecked(newChecked) {
    setChecked(newChecked);
    const newCheckedIds = [];
    newChecked.forEach((participant) => newCheckedIds.push(participant.id));
    onChange(newCheckedIds);
  }

  return (
    <div>
      <div style={{display: 'flex', alignItems: 'center'}}>
        <Typography>
          {intl.formatMessage({ id: listHeader })}
        </Typography>
        <div style={{flexGrow: 1}} />
        {!useShowAllOnly && (
          <div>
            {intl.formatMessage({ id: 'onlyThisGroup' })}
            <Checkbox
              checked={groupOnly}
              onClick={() => setGroupOnly(!groupOnly)}
            />
          </div>
        )}
      </div>
      <IdentityList participants={participants} setChecked={mySetChecked} checked={checked} />
      {requiresInput && (
        <Typography color='error'>
          {intl.formatMessage({ id: 'requiresInputListHeader' })}
        </Typography>
      )}
    </div>
  );
}

AssignmentList.propTypes = {
  fullMarketPresences: PropTypes.arrayOf(PropTypes.object),
  listHeader: PropTypes.string,
  previouslyAssigned: PropTypes.arrayOf(PropTypes.string),
  cannotBeAssigned: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func,
  requiresInput: PropTypes.bool,
  groupId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  showAllOnly: PropTypes.bool
};

AssignmentList.defaultProps = {
  listHeader: 'assignmentListHeader',
  onChange: () => {},
  previouslyAssigned: [],
  cannotBeAssigned: [],
  requiresInput: false,
  showAllOnly: false
};

export default AssignmentList;
