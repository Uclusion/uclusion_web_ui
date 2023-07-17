import React, { useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useIntl } from 'react-intl';
import Typography from '@material-ui/core/Typography';
import IdentityList from '../../../components/Email/IdentityList';

function AssignmentList(props) {
  const {
    fullMarketPresences,
    onChange,
    previouslyAssigned,
    cannotBeAssigned,
    listHeader,
    requiresInput
  } = props;
  const [checked, setChecked] = useState(fullMarketPresences.filter((presence) =>
    previouslyAssigned.includes(presence.id)));
  const intl = useIntl();
  const marketPresences = fullMarketPresences.filter((presence) => !presence.market_banned);

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
      <Typography>
        {intl.formatMessage({ id: listHeader })}
      </Typography>
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
  requiresInput: PropTypes.bool
};

AssignmentList.defaultProps = {
  listHeader: 'assignmentListHeader',
  onChange: () => {},
  previouslyAssigned: [],
  cannotBeAssigned: [],
  requiresInput: false
};

export default AssignmentList;
