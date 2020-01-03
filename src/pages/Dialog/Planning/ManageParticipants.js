import React from 'react';
import PropTypes from 'prop-types';
import { List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction } from '@material-ui/core';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import SubSection from '../../../containers/SubSection/SubSection';
import { getUserEligibleForObserver } from './userUtils';
import ChangeToObserverButton from '../../Home/Decision/ChangeToObserverButton';
import ChangeToParticipantButton from '../../Home/Decision/ChangeToParticipantButton';
import AddressList from '../AddressList';
import VisibilityIcon from '@material-ui/icons/Visibility';
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown';


function ManageParticipants(props) {

  const {
    marketId,
    investibles,
    marketPresences,
  } = props;

  const intl = useIntl();

  function getIcon(following) {
    if (following) {
      return <ThumbsUpDownIcon />;
    }
    return <VisibilityIcon />;
  }

  function getUserItem(presence) {
    const { id: userId, name, following } = presence;
    const observerEligible = getUserEligibleForObserver(userId, marketId, investibles);
    return (
      <ListItem
        key={userId}
        button
      >
        <ListItemIcon>
          {getIcon(following)}
        </ListItemIcon>

        <ListItemText>
          {name}
        </ListItemText>
        <ListItemSecondaryAction>
          {(observerEligible && following) && (
            <ChangeToObserverButton
              marketId={marketId}
              translationId="manageParticipantsMakeObserver"
            />
          )}
          {(observerEligible && !following) && (
            <ChangeToParticipantButton
              marketId={marketId}
              translationId="manageParticipantsMakeParticipant"
            />
          )}
        </ListItemSecondaryAction>
      </ListItem>
    );
  }

  function getUserItems() {
    const sorted = _.sortBy(marketPresences, 'name');
    return sorted.map((presence) => getUserItem(presence));
  }

  return (
    <div>
      <SubSection
        title={intl.formatMessage({ id: 'manageParticipantsCurrentTitle' })}
      >
        <List>
          {getUserItems()}
        </List>
      </SubSection>
      <SubSection
        title={intl.formatMessage({ id: 'manageParticipantsAddTitle' })}
      >
        <AddressList
          addToMarketId={marketId}
          isOwnScreen={false}
        />
      </SubSection>
    </div>
  );
}

ManageParticipants.propTypes = {
  marketId: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  investibles: PropTypes.arrayOf(PropTypes.object).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object).isRequired,
  onCancel: PropTypes.func,
};

ManageParticipants.defaultProps = {
  onCancel: () => {
  },
};

export default ManageParticipants;


