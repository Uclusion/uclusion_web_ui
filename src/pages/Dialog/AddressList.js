import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  makeStyles,
} from '@material-ui/core';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext';
import { addParticipants } from '../../api/users';


const useStyles = makeStyles((theme) => ({
  name: {},
  disabled: {
    color: theme.palette.text.disabled,
  },
}));

function AddressList(props) {
  const {
    addToMarketId,
    intl,
    onSave,
    onCancel,
    showObservers,
  } = props;
  const [operationRunning] = useContext(OperationInProgressContext);
  const classes = useStyles();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const addToMarketPresences = marketPresencesState[addToMarketId];
  const addToMarketPresencesHash = addToMarketPresences.reduce((acc, presence) => {
    const { external_id } = presence;
    return { ...acc, [external_id]: true };
  }, {});
  function extractUsersList() {
    return Object.keys(marketPresencesState).reduce((acc, marketId) => {
      const marketPresences = marketPresencesState[marketId];
      const macc = {};
      marketPresences.forEach((presence) => {
        const {
          id: user_id, name, account_id, external_id,
        } = presence;
        if (!addToMarketPresencesHash[external_id] && !acc[user_id] && !macc[user_id]) {
          macc[user_id] = {
            user_id, name, account_id, isChecked: false, isObserver: false,
          };
        }
      });
      return { ...acc, ...macc };
    }, {});
  }

  const [checked, setChecked] = useState(extractUsersList());

  function getCheckToggle(id) {
    return () => {
      const userDetail = checked[id];
      const { isChecked } = userDetail;
      const newChecked = {
        ...checked,
        [id]: { ...userDetail, isChecked: !isChecked },
      };
      setChecked(newChecked);
    };
  }

  function getObserverToggle(id) {
    return () => {
      const userDetail = checked[id];
      const { isObserver } = userDetail;
      const newChecked = {
        ...checked,
        [id]: { ...userDetail, isObserver: !isObserver },
      };
      setChecked(newChecked);
    };
  }

  function renderParticipantEntry(presenceEntry) {
    const {
      user_id: id, name, isChecked, isObserver,
    } = presenceEntry[1];
    return (
      <ListItem
        key={id}
      >
        <ListItemIcon>
          <Checkbox
            onClick={getCheckToggle(id)}
            checked={isChecked}
          />
        </ListItemIcon>
        <ListItemText
          className={classes.name}
        >
          {name}
        </ListItemText>
        {showObservers && (
          <ListItemIcon>
            <Checkbox
              onClick={getObserverToggle(id)}
              checked={isObserver}
            />
          </ListItemIcon>
        )}
      </ListItem>
    );
  }

  function handleSave() {
    const participants = Object.keys(checked).map((key) => checked[key]);
    const toAdd = participants.filter((participant) => participant.isChecked);
    const toAddClean = toAdd.map((participant) => {
      const { user_id, account_id, isObserver } = participant;
      return { user_id, account_id, is_observer: isObserver };
    });
    return addParticipants(addToMarketId, toAddClean).then(() => console.log('Add successful'));
  }

  return (
    <List
      dense
    >
      {Object.entries(checked).map((entry) => renderParticipantEntry(entry))}
      <ListItem
        key="buttons"
      >
        <Button
          disabled={operationRunning}
          onClick={onCancel}
        >
          {intl.formatMessage({ id: 'addressAddCancelLabel' })}
        </Button>
        <SpinBlockingButton
          variant="contained"
          color="primary"
          onClick={handleSave}
          marketId={addToMarketId}
          onSpinStop={onSave}
        >
          {intl.formatMessage({ id: 'addressAddSaveLabel' })}
        </SpinBlockingButton>
      </ListItem>
    </List>
  );
}

AddressList.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  intl: PropTypes.object.isRequired,
  addToMarketId: PropTypes.string.isRequired,
  showObservers: PropTypes.bool,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
};

AddressList.defaultProps = {
  showObservers: true,
  onSave: () => {
  },
  onCancel: () => {
  },
};

export default AddressList;
