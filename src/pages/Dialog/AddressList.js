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
  } = props;
  const [operationRunning] = useContext(OperationInProgressContext);
  const classes = useStyles();
  const processed = {};
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
            user_id, name, account_id, isChecked: false,
          };
        }
      });
      return { ...acc, ...macc };
    }, {});
  }

  const [checked, setChecked] = useState(extractUsersList());

  function getCheckToggle(id) {
    return () => {
      const userDetail = processed[id];
      const { isChecked } = userDetail;
      const newChecked = {
        ...checked,
        [id]: { ...userDetail, isChecked: !isChecked },
      };
      setChecked(newChecked);
    };
  }

  function renderParticipantEntry(presenceEntry) {
    const { user_id: id, name, isChecked } = presenceEntry[1];
    return (
      <ListItem
        key={id}
        onClick={getCheckToggle(id)}
      >
        <ListItemIcon>
          <Checkbox
            checked={isChecked}
          />
        </ListItemIcon>
        <ListItemText
          className={classes.name}
        >
          {name}
        </ListItemText>
      </ListItem>
    );
  }

  function handleSave() {
    // TODO
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
          {intl.formatMessage({ id: 'investibleAddCancelLabel' })}
        </Button>
        <SpinBlockingButton
          variant="contained"
          color="primary"
          onClick={handleSave}
          marketId={addToMarketId}
          onSpinStop={() => onSave()}
        >
          {intl.formatMessage({ id: 'investibleAddSaveLabel' })}
        </SpinBlockingButton>
      </ListItem>
    </List>
  );
}

AddressList.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  intl: PropTypes.object.isRequired,
  addToMarketId: PropTypes.string.isRequired,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
};

AddressList.defaultProps = {
  onSave: () => {
  },
  onCancel: () => {
  },
};

export default AddressList;
