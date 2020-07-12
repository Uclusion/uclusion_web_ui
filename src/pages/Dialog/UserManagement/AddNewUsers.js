import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { useIntl } from 'react-intl'
import {
  CardActions,
  Checkbox,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from '@material-ui/core'
import SearchIcon from '@material-ui/icons/Search'
import clsx from 'clsx'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton'
import { addParticipants, inviteParticipants } from '../../../api/users'
import InviteLinker from '../InviteLinker'
import { usePlanFormStyles } from '../../../components/AgilePlan'
import { addMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesContextReducer'
import { extractUsersList } from '../../../utils/userFunctions'

function AddNewUsers (props) {
  const {
    market,
    onSave,
    onCancel
  } = props;
  const { id: addToMarketId, market_type: marketType, invite_capability: marketToken } = market;
  const classes = usePlanFormStyles();
  const intl = useIntl();
  const [marketPresencesState, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [email1, setEmail1] = useState(undefined);

  function handleEmail1 (event) {
    const { value } = event.target;
    setEmail1(value);
  }

  const defaultChecked = extractUsersList(marketPresencesState, addToMarketId);
  const [checked, setChecked] = useState(defaultChecked);
  const [searchValue, setSearchValue] = useState(undefined);
  const [filteredNames, setFilteredNames] = useState(undefined);
  const participants = Object.keys(checked).map((key) => checked[key]);
  const anySelected = participants.find((participant) => participant.isChecked);

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

  function getCheckToggle (id) {
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

  function renderParticipantEntry (presenceEntry) {
    const {
      user_id: id, name, isChecked, domain,
    } = presenceEntry[1];
    return (
      <ListItem
        key={id}
        className={ isChecked ? clsx( classes.unselected, classes.selected ) : classes.unselected }
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

  function addInvitees() {
    const participants = [];
    if (email1) {
      const emails = email1.split(',');
      emails.forEach((email) => participants.push({ email }));
    }
    if (_.isEmpty(participants)) {
      return Promise.resolve(true);
    }
    return inviteParticipants(addToMarketId, participants).then(() => {
      setEmail1('');
    });
  }
  function handleCancel () {
    participants.map((participant) => {return participant.isChecked = false});
    setEmail1(undefined);

    if(typeof onCancel === 'function' ){
      onCancel();
    }
  }
  function handleSave () {
    const toAdd = participants.filter((participant) => participant.isChecked) || [];
    const toAddClean = toAdd.map((participant) => {
      const { user_id, account_id } = participant;
      return { user_id, account_id };
    });
    return addInvitees().then(() => {
      if (_.isEmpty(toAddClean)) {
        return {
          result: undefined,
          spinChecker: () => Promise.resolve(true),
        };
      }
      return addParticipants(addToMarketId, toAddClean)
        .then((result) => {
          return {
            result,
            spinChecker: () => Promise.resolve(true),
          };
        });
    });
  }

  function onSearchChange (event) {
    const { value } = event.target;
    setSearchValue(value);
  }

  function onSaveSpinStop (result) {
    if (!result) {
      return;
    }
    marketPresencesDispatch(addMarketPresences(addToMarketId, result));
    onSave();
  }

  const displayNames = filteredNames || Object.entries(checked) || [];

  return (
    <>
      <List
        dense
        className={clsx(classes.scrollableList, classes.sharedForm, classes.paddingRight)}
      >
        <ListItem className={classes.searchContainer} key="search">
          <ListItemText >
            <TextField
              className={classes.search}
              placeholder="Search in your organization"
              onChange={onSearchChange}
              InputProps={{
                startAdornment: (
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
        <List
          dense
          id="addressBook"
          className={classes.scrollContainer}
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
      </List>
      <div className={classes.spacer}></div>
      <List
        dense
      >
        <ListItem className={classes.listItem}>
          <Typography className={clsx(classes.cardTitle, classes.noPadding)}>
            {intl.formatMessage({ id: 'addParticipantsNewPerson' })}
          </Typography>
        </ListItem>
        <ListItem className={classes.listItem}>
          <InviteLinker
            marketType={marketType}
            marketToken={marketToken}
          />
        </ListItem>
        <form
          autoComplete="off"
        >
          <ListItem
            className={classes.listItem}
            id="emailInput"
            key="emailInput"
          >
            <ListItemText>
              <Typography style={{ marginBottom: 15 }}>
                {intl.formatMessage({ id: 'inviteParticipantsEmailLabel' })}
              </Typography>
              <TextField
                className={classes.input}
                variant="standard"
                id="email1"
                name="email1"
                fullWidth
                label={intl.formatMessage({ id: 'searchParticipantsPlaceholder' })}
                value={email1}
                onChange={handleEmail1}
              />
            </ListItemText>
          </ListItem>
          <ListItem id="emailButtons" key="emailButtons" className={clsx(classes.rightAlign, classes.listItem)}>
            <CardActions className={classes.actions}>
              <SpinBlockingButton
                  id="save"
                  variant="contained"
                  color="primary"
                  className={classes.actionSecondary}
                  onClick={handleCancel}
                  marketId={addToMarketId}
                >
                  Cancel
              </SpinBlockingButton>
              <SpinBlockingButton
                id="save"
                variant="contained"
                color="primary"
                className={classes.actionPrimary}
                onClick={handleSave}
                marketId={addToMarketId}
                onSpinStop={onSaveSpinStop}
                hasSpinChecker
                disabled={_.isEmpty(anySelected)&&_.isEmpty(email1)}
              >
                Add Collaborators
              </SpinBlockingButton>
            </CardActions>
          </ListItem>
        </form>
      </List>
    </>
  );
}

AddNewUsers.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  onSave: PropTypes.func,
};

AddNewUsers.defaultProps = {
  onSave: () => {
  },
};

export default AddNewUsers;
