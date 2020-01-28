import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useIntl } from 'react-intl';
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
import Grid from '@material-ui/core/Grid';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import { addParticipants, inviteParticipants } from '../../api/users';
import InviteLinker from './InviteLinker';
import SpinBlockingButtonGroup from '../../components/SpinBlocking/SpinBlockingButtonGroup';
import DeadlineExtender from './Decision/DeadlineExtender';
import { ACTIVE_STAGE, DECISION_TYPE } from '../../constants/markets';
import ChangeToObserverButton from './ChangeToObserverButton';
import ChangeToParticipantButton from './ChangeToParticipantButton';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import ApiBlockingButton from '../../components/SpinBlocking/ApiBlockingButton';

const useStyles = makeStyles((theme) => ({
  name: {},
  disabled: {
    color: theme.palette.text.disabled,
  },
  form: {
    width: '100%',
    marginTop: theme.spacing(3),
  },
}));

function AddressList(props) {
  const {
    market,
    onSave,
    onCancel,
    showObservers,
    isOwnScreen,
    isAdmin,
    following,
    myUserId,
  } = props;
  const { id: addToMarketId, market_stage: marketStage, market_type: marketType } = market;
  const classes = useStyles();
  const intl = useIntl();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [email1, setEmail1] = useState(undefined);
  const [email2, setEmail2] = useState(undefined);
  const [email3, setEmail3] = useState(undefined);
  const [email4, setEmail4] = useState(undefined);
  function handleEmail1(event) {
    const { value } = event.target;
    setEmail1(value);
  }
  function handleEmail2(event) {
    const { value } = event.target;
    setEmail2(value);
  }
  function handleEmail3(event) {
    const { value } = event.target;
    setEmail3(value);
  }
  function handleEmail4(event) {
    const { value } = event.target;
    setEmail4(value);
  }
  const inviteFormInvalid = _.isEmpty(email1) && _.isEmpty(email2)
    && _.isEmpty(email3) && _.isEmpty(email4);
  function onInvite(form) {
    form.preventDefault();
    const emailList = [];
    if (email1) {
      emailList.push(email1);
    }
    if (email2) {
      emailList.push(email2);
    }
    if (email3) {
      emailList.push(email3);
    }
    if (email4) {
      emailList.push(email4);
    }
    return inviteParticipants(addToMarketId, emailList).then(() => console.debug('Invite successful'));
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
  const active = marketStage === ACTIVE_STAGE;

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
      {isAdmin && active && (
        <>
          <Typography>
            {intl.formatMessage({ id: 'decisionDialogExtendDaysLabel' })}
          </Typography>
          <DeadlineExtender
            market={market}
          />
        </>
      )}
      {!isAdmin && active && marketType === DECISION_TYPE && following && (
        <ChangeToObserverButton
          marketId={addToMarketId}
          userId={myUserId}
          translationId="addressListMakeObserver"
        />
      )}
      {active && marketType === DECISION_TYPE && !following && (
        <ChangeToParticipantButton
          marketId={addToMarketId}
          userId={myUserId}
          translationId="manageParticipantsMakeParticipant"
        />
      )}
      <Typography>
        {intl.formatMessage({ id: 'addParticipantsNewPerson' })}
      </Typography>
      <InviteLinker
        marketId={addToMarketId}
      />
      <form
        className={classes.form}
        autoComplete="off"
        onSubmit={onInvite}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              variant="outlined"
              fullWidth
              id="email1"
              name="email1"
              type="email"
              label={intl.formatMessage({ id: 'inviteParticipantsEmailLabel' })}
              onChange={handleEmail1}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              variant="outlined"
              fullWidth
              id="email2"
              name="email2"
              type="email"
              label={intl.formatMessage({ id: 'inviteParticipantsEmailLabel' })}
              onChange={handleEmail2}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              variant="outlined"
              fullWidth
              id="email3"
              name="email3"
              type="email"
              label={intl.formatMessage({ id: 'inviteParticipantsEmailLabel' })}
              onChange={handleEmail3}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              variant="outlined"
              fullWidth
              id="email4"
              name="email4"
              type="email"
              label={intl.formatMessage({ id: 'inviteParticipantsEmailLabel' })}
              onChange={handleEmail4}
            />
          </Grid>
        </Grid>
        <ApiBlockingButton
          fullWidth
          variant="contained"
          className={classes.submit}
          type="submit"
          disabled={inviteFormInvalid}
        >
          {intl.formatMessage({ id: 'inviteParticipantsLabel' })}
        </ApiBlockingButton>
      </form>
      <List
        dense
      >
        <ListItem key="search" divider>
          <ListItemText className={classes.name}>
            <TextField
              onChange={onSearchChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment>
                    <IconButton>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </ListItemText>
          {showObservers && (
            <ListItemIcon>
              <ListItemText>
                {intl.formatMessage({ id: 'isObserver' })}
              </ListItemText>
            </ListItemIcon>
          )}
        </ListItem>
        {displayNames.map((entry) => renderParticipantEntry(entry))}
        <ListItem
          key="buttons"
        >
          <SpinBlockingButtonGroup>
            <Button
              onClick={myOnCancel}
            >
              {!isOwnScreen && intl.formatMessage({ id: 'addressAddClearLabel' })}
              {isOwnScreen && intl.formatMessage({ id: 'addressAddCancelLabel' })}
            </Button>
            <SpinBlockingButton
              variant="contained"
              color="primary"
              onClick={handleSave}
              marketId={addToMarketId}
              onSpinStop={onSave}
              disabled={_.isEmpty(anySelected)}
            >
              {intl.formatMessage({ id: 'addressAddSaveLabel' })}
            </SpinBlockingButton>
          </SpinBlockingButtonGroup>
        </ListItem>
      </List>
    </div>
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
  myUserId: PropTypes.string,
};

AddressList.defaultProps = {
  showObservers: true,
  myUserId: '',
  onSave: () => {
  },
  onCancel: () => {
  },
  isOwnScreen: true,
  isAdmin: false,
  following: false,
};

export default AddressList;
