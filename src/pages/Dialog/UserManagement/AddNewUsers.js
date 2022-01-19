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

  const participants = Object.values(extractUsersList(marketPresencesState, addToMarketId));
  const [checked, setChecked] = useState([]);
  const [searchValue, setSearchValue] = useState(undefined);
  const [filteredNames, setFilteredNames] = useState(undefined);
  const [emailsSent, setEmailsSent] = useState([]);

  useEffect(() => {
    if (!searchValue) {
      setFilteredNames(undefined);
    } else if (participants) {
      const searchValueLower = searchValue.toLowerCase();
      const filteredEntries = participants.filter((entry) => {
        const { name } = entry;
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
  }, [searchValue, participants]);

  function getCheckToggle (id) {
    return () => {
      const found = checked.find((item) => item.user_id === id);
      if (!found) {
        const userDetail = participants.find((participant) => participant.user_id === id);
        if (userDetail) {
          setChecked(checked.concat([userDetail]));
        }
      } else {
        setChecked(checked.filter((item) => item.user_id !== id));
      }
    };
  }

  function renderParticipantEntry (presenceEntry) {
    const {
      user_id: id, name, email,
    } = presenceEntry;
    const isChecked = !_.isEmpty(checked.find((item) => item.user_id === id));
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
    const added = [];
    const emailSentTemp = [];
    if (email1) {
      const emails = email1.split(',');
      emails.forEach((email) => {
        const emailTrimmed = email.trim();
        added.push({ email: emailTrimmed })
        emailSentTemp.push(emailTrimmed)
      })
    }
    if (_.isEmpty(added)) {
      return Promise.resolve(true);
    }
    return inviteParticipants(addToMarketId, added).then((result) => {
      setEmail1('');
      onSaveSpinStop(result);
      setEmailsSent(emailsSent.concat(emailSentTemp));
    });
  }

  function handleSaveEmails() {
    return addInvitees().then(() => {
      setOperationRunning(false);
    });
  }

  function handleSaveParticipants() {
    const toAddClean = checked.map((participant) => {
      const { external_id, account_id } = participant
      return { external_id, account_id }
    });
    return addParticipants(addToMarketId, toAddClean)
      .then((result) => {
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
    const message = findMessageOfType('UNREAD_DRAFT', addToMarketId, messagesState);
    if (message) {
      messagesDispatch(removeMessage(message));
    }
  }

  const displayNames = filteredNames || participants || [];
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
                                       disabled={_.isEmpty(checked)}>
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
                                     disabled={_.isEmpty(email1)} allowOtherOperations={true}>
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
