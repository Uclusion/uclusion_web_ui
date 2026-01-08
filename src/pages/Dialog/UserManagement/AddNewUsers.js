import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useIntl } from 'react-intl';
import {
  Checkbox,
  IconButton,
  InputAdornment,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import clsx from 'clsx';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { usePlanFormStyles } from '../../../components/AgilePlan';
import GravatarAndName from '../../../components/Avatars/GravatarAndName';
import { getGroupPresences, getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import { AccountContext } from '../../../contexts/AccountContext/AccountContext';
import { fixName } from '../../../utils/userFunctions';
import { navigate, preventDefaultAndProp } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { ADD_COLLABORATOR_WIZARD_TYPE } from '../../../constants/markets';

function AddNewUsers(props) {
  const { market, setToAddClean, group, showAll=true } = props;
  const history = useHistory();
  const { id: addToMarketId } = market || {};
  const { id: groupId } = group || {};
  const classes = usePlanFormStyles();
  const intl = useIntl();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const [userState] = useContext(AccountContext);
  const { user: unsafeUser } = userState || {};
  const myUser = unsafeUser || {};

  const marketPresences = getMarketPresences(marketPresencesState, addToMarketId) || [];
  const addToMarketPresences = groupId ?
    getGroupPresences(marketPresences, groupPresencesState, addToMarketId, groupId, !showAll) :
    (addToMarketId ? marketPresences : [myUser]);
  const participants = _.differenceBy(marketPresences, addToMarketPresences, 'id');
  const [checked, setChecked] = useState([]);
  const [searchValue, setSearchValue] = useState(undefined);
  const [filteredNames, setFilteredNames] = useState(undefined);

  useEffect(() => {
    if (!searchValue) {
      setFilteredNames(undefined)
    } else if (participants) {
      const searchValueLower = searchValue.toLowerCase()
      const filteredEntries = participants.filter((entry) => {
        const { name } = entry
        const nameLower = name.toLowerCase()
        let index = 0
        // eslint-disable-next-line no-restricted-syntax
        for (const c of searchValueLower) {
          const foundIndex = _.indexOf(nameLower, c, index)
          if (foundIndex < 0) {
            return false
          }
          index = foundIndex
        }
        return true
      })
      setFilteredNames(filteredEntries)
    }
  }, [searchValue, participants])

  function generateToAddClean (myChecked) {
    return myChecked.map((participant) => {
      const { external_id, account_id, id } = participant
      return { external_id, account_id, id }
    })
  }

  function getCheckToggle (id) {
    return () => {
      const found = checked.find((item) => item.id === id)
      if (!found) {
        const userDetail = participants.find((participant) => participant.id === id)
        if (userDetail) {
          const myChecked = checked.concat([userDetail])
          setChecked(myChecked)
          if (setToAddClean) {
            setToAddClean(generateToAddClean(myChecked))
          }
        }
      } else {
        const myChecked = checked.filter((item) => item.id !== id)
        setChecked(myChecked)
        if (setToAddClean) {
          setToAddClean(generateToAddClean(myChecked))
        }
      }
    }
  }

  function renderParticipantEntry (presenceEntry) {
    const {
      id, name, email,
    } = presenceEntry
    const isChecked = !_.isEmpty(checked.find((item) => item.id === id))
    return (
      <ListItem
        key={id}
        onClick={getCheckToggle(id)}
        className={isChecked ? clsx(classes.unselected, classes.selected) : classes.unselected}
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
            name={fixName(name)}
            typographyVariant="caption"
            typographyClassName={classes.avatarName}
          />
        </ListItemText>
      </ListItem>
    )
  }

  function onSearchChange (event) {
    const { value } = event.target
    setSearchValue(value)
  }

  const displayNames = filteredNames || participants || [];
  const pathAddCollaborator = `/wizard#type=${ADD_COLLABORATOR_WIZARD_TYPE.toLowerCase()}&marketId=${addToMarketId}`;
  return (
    <>
      {displayNames.length > 0 &&
        <>
          <List
            dense
            className={classes.scrollableList}
          >
            <ListItem className={classes.searchContainer} key="search">
              {_.size(participants) > 10 && (
                <ListItemText>
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
                      )
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
          <div className={classes.spacer} style={{ maxWidth: '5rem' }}/>
        </>
      }
      {displayNames.length === 0 && (
        <Typography variant="body1">
          {intl.formatMessage({ id: 'everyoneInGroupAddExplanation' })}
          <br/><br/>
          To add collaborators click <Link href={pathAddCollaborator} onClick={(event) => {
          preventDefaultAndProp(event);
          navigate(history, pathAddCollaborator);
        }}>here</Link>.
        </Typography>
      )}
    </>
  )
}

AddNewUsers.propTypes = {
  market: PropTypes.object,
  onSave: PropTypes.func,
}

export default AddNewUsers
