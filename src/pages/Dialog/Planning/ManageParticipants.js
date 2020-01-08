import React from 'react';
import PropTypes from 'prop-types';
import {
  List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, Button,
} from '@material-ui/core';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import VisibilityIcon from '@material-ui/icons/Visibility';
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown';
import SubSection from '../../../containers/SubSection/SubSection';
import { getUserEligibleForObserver } from './userUtils';
import ChangeToObserverButton from '../../Home/Decision/ChangeToObserverButton';
import ChangeToParticipantButton from '../../Home/Decision/ChangeToParticipantButton';
import AddressList from '../AddressList';


function ManageParticipants(props) {
  const {
    market,
    investibles,
    marketPresences,
    onCancel,
    onSave,
  } = props;
  const { id: marketId } = market;
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
              userId={userId}
              translationId="manageParticipantsMakeObserver"
            />
          )}
          {(observerEligible && !following) && (
            <ChangeToParticipantButton
              marketId={marketId}
              userId={userId}
              translationId="manageParticipantsMakeParticipant"
            />
          )}
          {!observerEligible && (
            <Button
              size="small"
              variant="contained"
              disabled
            >
              {intl.formatMessage({ id: 'manageParticipantsHasAsignments' })}
            </Button>
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
          market={market}
          isOwnScreen={false}
          onCancel={onCancel}
          onSave={onSave}
        />
      </SubSection>
    </div>
  );
}

ManageParticipants.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  investibles: PropTypes.arrayOf(PropTypes.object).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object).isRequired,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
};

ManageParticipants.defaultProps = {
  onCancel: () => {
  },
  onSave: () => {
  },
};

export default ManageParticipants;
