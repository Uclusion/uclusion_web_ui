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

  function onInvite(form) {
    form.preventDefault();
    const participants = [];
    if (email1) {
      const emails = email1.split(',');
      emails.forEach((email) => participants.push({ email }));
    }
    return inviteParticipants(addToMarketId, participants).then(() => {
      setEmail1('');
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
            user_id, name, account_id, domain: emailSplit[1], isChecked: false,
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

  function renderParticipantEntry(presenceEntry) {
    const {
      user_id: id, name, isChecked, domain,
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
      </ListItem>
    );
  }

  function handleSave() {
    const toAdd = participants.filter((participant) => participant.isChecked);
    const toAddClean = toAdd.map((participant) => {
      const { user_id, account_id } = participant;
      return { user_id, account_id };
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
        <List
          dense
        >
          <Typography class={classes.sectionHeader}>
            {intl.formatMessage({ id: 'searchParticipantsLabel' })}
          </Typography>
           <ListItem key="search">
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
          </ListItem>
        </List>
        <List
          dense
          id="addressBook"
          className={classes.scrollableList}
        >
          {displayNames.length > 0 &&
            displayNames.map((entry) => renderParticipantEntry(entry))
          }
          {displayNames.length < 1 &&
            <ListItemText style={{ textAlign: 'center' }}>
            {intl.formatMessage({ id: 'noCollaboratorsLabel' })}
            </ListItemText>
          }
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
              id="addExistingCollaborator"
            />
          </SpinBlockingButton>
        </CardActions>
      <List
        dense
      >
      <ListItem>
        <Typography class={classes.sectionHeader}>
          {intl.formatMessage({ id: 'addParticipantsNewPerson' })}
        </Typography>
      </ListItem>
      <ListItem>
        <InviteLinker
          marketType={marketType}
          marketId={addToMarketId}
        />
      </ListItem>
      <form
        autoComplete="off"
        onSubmit={onInvite}
      >
        <ListItem
          id="emailInput"
          key="emailInput"
        >
          <ListItemText>
            <Typography style={{ marginBottom: 15 }}>
              {intl.formatMessage({ id: 'inviteParticipantsEmailLabel' })}
            </Typography>
            <TextField
              variant="outlined"
              id="email1"
              name="email1"
              fullWidth
              label={intl.formatMessage({ id: 'searchParticipantsPlaceholder' })}
              value={email1}
              onChange={handleEmail1}
            />
          </ListItemText>
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
            <ApiBlockingButton
              variant="contained"
              className={classes.actionPrimary}
              type="submit"
              disabled={_.isEmpty(email1)}
            >
              <FormattedMessage
                id="inviteParticipantsLabel"
              />
            </ApiBlockingButton>
          </CardActions>
        </form>
      </List>
    </>
  );
}

AddressList.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  isOwnScreen: PropTypes.bool,
  isAdmin: PropTypes.bool,
};

AddressList.defaultProps = {
  onSave: () => {
  },
  onCancel: () => {
  },
  isOwnScreen: true,
  isAdmin: false,
};

export default AddressList;
