import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  Button,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  makeStyles, Typography,
} from '@material-ui/core';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconButton from '@material-ui/core/IconButton';
import SearchIcon from '@material-ui/icons/Search';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext';
import { addParticipants } from '../../api/users';
import { useIntl } from 'react-intl';
import InviteLinker from '../Home/Decision/InviteLinker';

const useStyles = makeStyles((theme) => ({
  name: {},
  disabled: {
    color: theme.palette.text.disabled,
  },
}));

function AddressList(props) {
  const {
    addToMarketId,
    onSave,
    onCancel,
    showObservers,
  } = props;
  const [operationRunning] = useContext(OperationInProgressContext);
  const classes = useStyles();
  const intl = useIntl();
  const [marketPresencesState] = useContext(MarketPresencesContext);

  function extractUsersList() {
    const addToMarketPresences = marketPresencesState[addToMarketId];
    const addToMarketPresencesHash = addToMarketPresences.reduce((acc, presence) => {
      const { external_id } = presence;
      return { ...acc, [external_id]: true };
    }, {});
    return Object.keys(marketPresencesState).reduce((acc, marketId) => {
      const marketPresences = marketPresencesState[marketId];
      const macc = {};
      marketPresences.forEach((presence) => {
        const {
          id: user_id, name, account_id, external_id, email,
        } = presence;
        if (!addToMarketPresencesHash[external_id] && !acc[user_id] && !macc[user_id]) {
          const emailSplit = email ? email.split('@') : ['', ''];
          addToMarketPresencesHash[external_id] = true;
          macc[user_id] = {
            user_id, name, account_id, domain: emailSplit[1], isChecked: false, isObserver: false,
          };
        }
      });
      return { ...acc, ...macc };
    }, {});
  }

  const [checked, setChecked] = useState(extractUsersList());
  const [searchValue, setSearchValue] = useState(undefined);
  const [filteredNames, setFilteredNames] = useState(undefined);

  useEffect(() => {
    if (!searchValue) {
      setFilteredNames(undefined);
    } else if (checked) {
      const filteredEntries = Object.entries(checked).filter((entry) => {
        const { name } = entry[1];
        let index = 0;
        // eslint-disable-next-line no-restricted-syntax
        for (const c of searchValue) {
          const foundIndex = _.indexOf(name, c, index);
          if (foundIndex < 0) {
            return false;
          }
          index = foundIndex;
        }
        return true;
      });
      setFilteredNames(filteredEntries);
    }
  }, [searchValue, checked]);

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
      user_id: id, name, isChecked, isObserver, domain,
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
        <ListItemText
          className={classes.name}
        >
          {domain}
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
    return addParticipants(addToMarketId, toAddClean).then(() => console.debug('Add successful'));
  }

  function onSearchChange(event) {
    const { value } = event.target;
    setSearchValue(value);
  }

  const displayNames = filteredNames || Object.entries(checked) || [];

  return (
    <div>
      <Typography>
        {intl.formatMessage({ id: 'addParticipantsNewPerson' })}
      </Typography>
      <InviteLinker
        marketId={addToMarketId}
      />
      <List
        dense
      >
        <ListItem key="search">
          <TextField
            onChange={onSearchChange}
            InputProps={{
              endAdornment: (
                <InputAdornment>
                  <IconButton>
                    <SearchIcon/>
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </ListItem>
        {displayNames.map((entry) => renderParticipantEntry(entry))}
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
    </div>
  );
}

AddressList.propTypes = {
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
