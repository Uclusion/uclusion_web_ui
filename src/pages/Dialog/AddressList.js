import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl'
import {
  Button,
  CardActions,
  Checkbox,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  TextField,
} from '@material-ui/core'
import SearchIcon from '@material-ui/icons/Search';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import { addParticipants, inviteParticipants } from '../../api/users';
import InviteLinker from './InviteLinker';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import ApiBlockingButton from '../../components/SpinBlocking/ApiBlockingButton';
import { usePlanFormStyles } from '../../components/AgilePlan';

function AddressList(props) {
  const {
    market,
    onSave,
    onCancel,
    showObservers,
  } = props;
  const { id: addToMarketId, market_type: marketType } = market;
  const classes = usePlanFormStyles();
  const intl = useIntl();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [email1, setEmail1] = useState(undefined);

  function handleEmail1(event) {
    const { value } = event.target;
    setEmail1(value);
  }

  const [isObserver1, setIsObserver1] = useState(false);

  function handleIsObserver1() {
    setIsObserver1(!isObserver1);
  }

  const inviteFormInvalid = _.isEmpty(email1);

  function onInvite(form) {
    form.preventDefault();
    const participants = [];
    if (email1) {
      participants.push({ email: email1, is_observer: isObserver1 });
    }
    return inviteParticipants(addToMarketId, participants).then(() => {
      setEmail1(undefined);
      setIsObserver1(false);
    });
  }

  function extractUsersList() {
    const addToMarketPresences = getMarketPresences(marketPresencesState, addToMarketId) || [];
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

  const defaultChecked = extractUsersList();
  const [checked, setChecked] = useState(defaultChecked);
  const [searchValue, setSearchValue] = useState(undefined);
  const [filteredNames, setFilteredNames] = useState(undefined);
  const participants = Object.keys(checked).map((key) => checked[key]);
  const anySelected = participants.find((participant) => participant.isChecked);

  function myOnCancel() {
    setChecked(defaultChecked);
    onCancel();
  }

  useEffect(() => {
    if (!searchValue) {
      setFilteredNames(undefined);
    } else if (checked) {
      const searchValueLower = searchValue.toLowerCase();
      const filteredEntries = Object.entries(checked).filter((entry) => {
        const { name } = entry[1];
        const nameLower = name.toLowerCase();
        let index = 0;
        // eslint-disable-next-line no-restricted-syntax
        for (const c of searchValueLower) {
          const foundIndex = _.indexOf(nameLower, c, index);
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
        <ListItemIcon>
          <Checkbox
            onClick={getObserverToggle(id)}
            checked={isObserver}
          />
        </ListItemIcon>
      </ListItem>
    );
  }

  function handleSave() {
    const toAdd = participants.filter((participant) => participant.isChecked);
    const toAddClean = toAdd.map((participant) => {
      const { user_id, account_id, isObserver } = participant;
      return { user_id, account_id, is_observer: isObserver };
    });
    return addParticipants(addToMarketId, toAddClean); //.then((added) => // console.debug(added));
  }

  function onSearchChange(event) {
    const { value } = event.target;
    setSearchValue(value);
  }

  const displayNames = filteredNames || Object.entries(checked) || [];

  return (
    <>
      <form
        className={classes.form}
        autoComplete="off"
        onSubmit={onInvite}
      >
        <List
          dense
        >
          <Typography class={classes.sectionHeader}>
            {intl.formatMessage({ id: 'inviteParticipantsEmailLabel' })}
          </Typography>
           <ListItem key="search" divider>
            <ListItemText className={classes.name}>
              <TextField
                onChange={onSearchChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position={'end'}>
                      <IconButton>
                        <SearchIcon/>
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </ListItemText>
            <ListItemIcon>
              <ListItemText>
                {intl.formatMessage({ id: 'isObserver' })}
              </ListItemText>
            </ListItemIcon>
          </ListItem>
        </List>
        <List
          dense
          id="addressBook"
        >
          {displayNames.map((entry) => renderParticipantEntry(entry))}
        </List>
        <CardActions className={classes.actions}>
          <Button
            onClick={myOnCancel}
            className={classes.actionSecondary}
            color="secondary"
            variant="contained"
          >
            <FormattedMessage
              id="marketAddCancelLabel"
            />
          </Button>
          <ApiBlockingButton
            variant="contained"
            className={classes.actionPrimary}
            type="submit"
            disabled={inviteFormInvalid}
          >
            <FormattedMessage
              id="inviteParticipantsLabel"
            />
          </ApiBlockingButton>
        </CardActions>
      </form>
      <Typography class={classes.sectionHeader}>
        {intl.formatMessage({ id: 'addParticipantsNewPerson' })}
      </Typography>
      <ListItem>
        <InviteLinker
          marketType={marketType}
          showObserverLink={showObservers}
          marketId={addToMarketId}
          observerLabel={intl.formatMessage({ id: 'isObserver' })}
        />
      </ListItem>
      <ListItem
        id="emailInput"
        key="emailInput"
      >
        <ListItemText className={classes.name}>
          <TextField
            variant="outlined"
            id="email1"
            name="email1"
            type="email"
            fullWidth
            label={intl.formatMessage({ id: 'email' })}
            value={email1}
            onChange={handleEmail1}
          />
        </ListItemText>
        <ListItemIcon>
          <Checkbox
            id="isObserver1"
            onClick={handleIsObserver1}
            checked={isObserver1}
          />
        </ListItemIcon>
      </ListItem>
      <CardActions className={classes.actions}>
        <Button
          onClick={myOnCancel}
          className={classes.actionSecondary}
          color="secondary"
          variant="contained"
        >
          <FormattedMessage
            id="marketAddCancelLabel"
          />
        </Button>
        <SpinBlockingButton
          id="save"
          variant="contained"
          color="primary"
          className={classes.actionPrimary}
          onClick={handleSave}
          marketId={addToMarketId}
          onSpinStop={onSave}
          disabled={_.isEmpty(anySelected)}
        >
          <FormattedMessage
            id="agilePlanFormSaveLabel"
          />
        </SpinBlockingButton>
      </CardActions>
    </>
  );
}

AddressList.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  showObservers: PropTypes.bool,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  isOwnScreen: PropTypes.bool,
  isAdmin: PropTypes.bool,
  following: PropTypes.bool,
};

AddressList.defaultProps = {
  showObservers: true,
  onSave: () => {
  },
  onCancel: () => {
  },
  isOwnScreen: true,
  isAdmin: false,
  following: false,
};

export default AddressList;
