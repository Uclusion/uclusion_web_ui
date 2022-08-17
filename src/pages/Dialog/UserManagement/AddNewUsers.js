import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { useIntl } from 'react-intl'
import {
  Checkbox,
  IconButton,
  InputAdornment,
  List,
  ListItem,
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
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import { Email, SettingsBackupRestore } from '@material-ui/icons'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import GravatarAndName from '../../../components/Avatars/GravatarAndName'
import { AccountUserContext } from '../../../contexts/AccountUserContext/AccountUserContext'
import { getGroupPresences, getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext'

function AddNewUsers(props) {
  const { market, isAddToGroup = false, emailList, setEmailList, setToAddClean, group } = props;
  const { id: addToMarketId, market_type: marketType, invite_capability: marketToken } = market || {};
  const { id: groupId } = group || {};
  const classes = usePlanFormStyles();
  const intl = useIntl();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [marketPresencesState, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [marketState] = useContext(MarketsContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [userState] = useContext(AccountUserContext);
  const { user: unsafeUser } = userState || {};
  const myUser = unsafeUser || {};
  const [email1, setEmail1] = useState('');

  function handleEmail1(event) {
    const { value } = event.target;
    if (setEmailList) {
      setEmailList(value);
    } else {
      setEmail1(value);
    }
  }
  const marketPresences = getMarketPresences(marketPresencesState, addToMarketId) || [];
  const addToMarketPresences = groupId ?
    getGroupPresences(marketPresences, groupPresencesState, addToMarketId, groupId) :
    (addToMarketId ? marketPresences : [{external_id: myUser.external_id}]);
  const participants = Object.values(extractUsersList(marketPresencesState, marketState, addToMarketPresences));
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

  function generateToAddClean(myChecked) {
    return myChecked.map((participant) => {
      const { external_id, account_id } = participant
      return { external_id, account_id }
    });
  }

  function getCheckToggle(id) {
    return () => {
      const found = checked.find((item) => item.user_id === id);
      if (!found) {
        const userDetail = participants.find((participant) => participant.user_id === id);
        if (userDetail) {
          const myChecked = checked.concat([userDetail]);
          setChecked(myChecked);
          if (setToAddClean) {
            setToAddClean(generateToAddClean(myChecked));
          }
        }
      } else {
        const myChecked = checked.filter((item) => item.user_id !== id);
        setChecked(myChecked);
        if (setToAddClean) {
          setToAddClean(generateToAddClean(myChecked));
        }
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
        <ListItemText>
          <GravatarAndName
            key={id}
            email={email}
            name={name}
            typographyVariant="caption"
            typographyClassName={classes.avatarName}
          />
        </ListItemText>
      </ListItem>
    );
  }

  function addInvitees() {
    const added = [];
    if (email1) {
      const emails = email1.split(',');
      emails.forEach((email) => {
        const emailTrimmed = email.trim();
        added.push(emailTrimmed)
      })
    }
    if (_.isEmpty(added)) {
      return Promise.resolve(true);
    }
    return inviteParticipants(addToMarketId, added).then((result) => {
      setEmail1('');
      onSaveSpinStop(result);
      setEmailsSent(emailsSent.concat(added));
    });
  }

  function handleSaveEmails() {
    return addInvitees().then(() => {
      setOperationRunning(false);
    });
  }

  function handleSaveParticipants() {
    return addParticipants(addToMarketId, generateToAddClean(checked))
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
  }

  const displayNames = filteredNames || participants || [];
  const emailInputId = 'email1';
  return (
    <>
      {displayNames.length > 0 &&
        <>
          <List dense
                className={isAddToGroup ? classes.scrollableList : clsx(classes.scrollableList, classes.sharedForm)}>
            <ListItem className={classes.searchContainer} key="search">
              {!isAddToGroup && (
                <SpinningIconLabelButton onClick={handleSaveParticipants} icon={SettingsBackupRestore}
                                         id="participantAddButton"
                                         disabled={_.isEmpty(checked)}>
                  {intl.formatMessage({ id: mobileLayout ? 'addExistingCollaboratorMobile' :
                      'addExistingCollaborator' })}
                </SpinningIconLabelButton>
              )}
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
              className={_.size(participants) > 4 ? classes.scrollContainer : undefined}
            >
              {displayNames.map((entry) => renderParticipantEntry(entry))}
            </List>
          </List>
          <div className={classes.spacer} style={{maxWidth: '5rem'}} />
        </>
      }
      {isAddToGroup && displayNames.length === 0 && (
        <Typography variant="body1">
          {intl.formatMessage({ id: 'everyoneInGroupAddExplanation' })}
        </Typography>
      )}
      {!isAddToGroup && (
        <List
          dense
          style={{padding: '0'}}
        >
          {displayNames.length > 0 &&
            <ListItem className={classes.listItem} style={{paddingTop: '0', paddingBottom: '1rem'}}>
              <Typography className={classes.cardTitle} style={{padding: '0'}}>
                {intl.formatMessage({ id: 'addParticipantsNewPerson' })}
              </Typography>
            </ListItem>
          }
          {emailsSent.length > 0 && (
            <>
              <ListItem className={classes.listItem}>
                <Typography className={classes.cardTitle} style={{padding: '0'}}>
                  {intl.formatMessage({ id: 'emailsSentLabel' })}
                </Typography>
              </ListItem>
              <ListItem>
                <List dense id='emailsSentList'>
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
          {addToMarketId && (!groupId || groupId === addToMarketId) && (
            <>
              <form
                autoComplete="off"
                className={classes.manage}
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
                      id={emailInputId}
                      name={emailInputId}
                      fullWidth
                      label={intl.formatMessage({ id: 'searchParticipantsPlaceholder' })}
                      value={emailList || email1}
                      onChange={handleEmail1}
                    />
                  </ListItemText>
                </ListItem>
                <ListItem id="emailButtons" key="emailButtons" className={classes.rightAlign}>
                  <SpinningIconLabelButton onClick={handleSaveEmails} icon={Email} id='addressAddSaveButton'
                                           allowOtherOperations={true}>
                    <Typography variant='body1'>
                      {intl.formatMessage({ id: 'addressAddSaveLabel' })}
                    </Typography>
                  </SpinningIconLabelButton>
                </ListItem>
              </form>
              <ListItem className={classes.listItem}>
                <InviteLinker
                  marketType={marketType}
                  marketToken={marketToken}
                />
              </ListItem>
            </>
          )}
        </List>
      )}
    </>
  );
}

AddNewUsers.propTypes = {
  market: PropTypes.object,
  onSave: PropTypes.func,
};

AddNewUsers.defaultProps = {
  onSave: () => {
  },
};

export default AddNewUsers;
