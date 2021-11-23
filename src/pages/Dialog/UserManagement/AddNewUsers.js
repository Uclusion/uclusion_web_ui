import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { useIntl } from 'react-intl'
import {
  Checkbox,
  IconButton,
  InputAdornment,
  List,
  ListItem, ListItemAvatar,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography, useMediaQuery, useTheme,
} from '@material-ui/core'
import SearchIcon from '@material-ui/icons/Search'
import clsx from 'clsx'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { addParticipants, inviteParticipants } from '../../../api/users'
import InviteLinker from '../InviteLinker'
import { usePlanFormStyles } from '../../../components/AgilePlan'
import { addMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesContextReducer'
import { extractUsersList } from '../../../utils/userFunctions'
import Gravatar from '../../../components/Avatars/Gravatar';
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import { Email, SettingsBackupRestore } from '@material-ui/icons'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { findMessageOfType } from '../../../utils/messageUtils'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import { removeMessage } from '../../../contexts/NotificationsContext/notificationsContextReducer'

function AddNewUsers (props) {
  const { market } = props;
  const { id: addToMarketId, market_type: marketType, invite_capability: marketToken } = market;
  const classes = usePlanFormStyles();
  const intl = useIntl();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [marketPresencesState, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [email1, setEmail1] = useState(undefined);

  function handleEmail1 (event) {
    const { value } = event.target;
    setEmail1(value);
  }

  const defaultChecked = extractUsersList(marketPresencesState, addToMarketId, null, true);
  const [checked, setChecked] = useState(defaultChecked);
  const [searchValue, setSearchValue] = useState(undefined);
  const [filteredNames, setFilteredNames] = useState(undefined);
  const participants = Object.keys(checked).map((key) => checked[key]) || [];
  const [emailsSent, setEmailsSent] = useState([]);
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
      user_id: id, name, isChecked, email,
    } = presenceEntry[1];
    return (
      <ListItem
        key={id}
        onClick={getCheckToggle(id)}
        className={ isChecked ? clsx( classes.unselected, classes.selected ) : classes.unselected }
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
        <ListItemAvatar>
          <Gravatar
            name={name}
            email={email}
            />
        </ListItemAvatar>
      </ListItem>
    );
  }

  function addInvitees() {
    const participants = [];
    if (email1) {
      const emails = email1.split(',')
      const emailSentTemp = []
      emails.forEach((email) => {
        const emailTrimmed = email.trim();
        participants.push({ email: emailTrimmed })
        emailSentTemp.push(emailTrimmed)
      })
      setEmailsSent(emailsSent.concat(emailSentTemp))
    }
    if (_.isEmpty(participants)) {
      return Promise.resolve(true);
    }
    return inviteParticipants(addToMarketId, participants).then((result) => {
      setEmail1('');
      onSaveSpinStop(result);
    });
  }

  function handleSaveEmails() {
    return addInvitees().then(() => {
      setOperationRunning(false);
    });
  }

  function handleSaveParticipants() {
    const toAdd = participants.filter((participant) => participant.isChecked) || [];
    const toAddClean = toAdd.map((participant) => {
      const { external_id, account_id } = participant
      return { external_id, account_id, is_guest: false }
    });
    return addParticipants(addToMarketId, toAddClean)
      .then((result) => {
        setChecked(participants.filter((participant) => !participant.isChecked) || []);
        setOperationRunning(false);
        onSaveSpinStop(result);
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
    const message = findMessageOfType('DRAFT', addToMarketId, messagesState);
    if (message) {
      messagesDispatch(removeMessage(message));
    }
  }

  const displayNames = filteredNames || Object.entries(checked) || [];
  return (
    <>
      {displayNames.length > 0 &&
        <>
          <List
            dense
            className={clsx(classes.scrollableList, classes.sharedForm)}
          >
            <ListItem className={classes.searchContainer} key="search">
              <SpinningIconLabelButton onClick={handleSaveParticipants} icon={SettingsBackupRestore}
                                       id="participantAddButton"
                                       disabled={_.isEmpty(anySelected)}>
                {intl.formatMessage({ id: mobileLayout ? 'addExistingCollaboratorMobile' :
                    'addExistingCollaborator' })}
              </SpinningIconLabelButton>
              {_.size(participants) > 10 && (
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
              )}
            </ListItem>
            <List
              dense
              id="addressBook"
              className={classes.scrollContainer}
            >
              {displayNames.map((entry) => renderParticipantEntry(entry))}
            </List>
          </List>
          <div className={classes.spacer} />
        </>
      }
      <List
        dense
        style={{maxWidth: '40rem', padding: '0'}}
      >
        {displayNames.length > 0 &&
          <ListItem className={classes.listItem} style={{paddingTop: '0', paddingBottom: '1rem'}}>
            <Typography className={classes.cardTitle} style={{padding: '0'}}>
              {intl.formatMessage({ id: 'addParticipantsNewPerson' })}
            </Typography>
          </ListItem>
        }
        <ListItem className={classes.listItem} style={{paddingBottom: '1.5rem'}}>
          <InviteLinker
            marketType={marketType}
            marketToken={marketToken}
          />
        </ListItem>
        {emailsSent.length > 0 && (
          <>
            <ListItem className={classes.listItem}>
              <Typography className={classes.cardTitle} style={{padding: '0'}}>
                {intl.formatMessage({ id: 'emailsSentLabel' })}
              </Typography>
            </ListItem>
            <ListItem>
              <List
                dense
                id="emailsSentList"
              >
                {emailsSent.map((entry) => {
                  return (
                    <ListItemText>
                      {entry}
                    </ListItemText>
                  )
                })
                }
              </List>
            </ListItem>
          </>
        )}
        <form
          autoComplete="off"
        >
          <ListItem
            className={classes.listItem}
            id="emailInput"
            key="emailInput"
          >
            <ListItemText>
              <Typography style={{ paddingBottom: '0.5rem' }}>
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
            <SpinningIconLabelButton onClick={handleSaveEmails} icon={Email} id="addressAddSaveButton"
                                     disabled={_.isEmpty(email1)}>
              {intl.formatMessage({ id: 'addressAddSaveLabel' })}
            </SpinningIconLabelButton>
          </ListItem>
        </form>
      </List>
    </>
  );
}

AddNewUsers.propTypes = {
  market: PropTypes.object.isRequired,
  onSave: PropTypes.func,
};

AddNewUsers.defaultProps = {
  onSave: () => {
  },
};

export default AddNewUsers;
