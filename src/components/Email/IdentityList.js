import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Checkbox,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField
} from '@material-ui/core';
import _ from 'lodash';
import clsx from 'clsx';
import SearchIcon from '@material-ui/icons/Search';
import GravatarAndName from '../Avatars/GravatarAndName';
import { usePlanFormStyles } from '../AgilePlan';

function IdentityList (props) {
  const { participants, checked, setChecked } = props;
  const classes = usePlanFormStyles();
  const [filteredNames, setFilteredNames] = useState(participants);
  function getCheckToggle(id) {
    return () => {
      if (!checked.find((item) => item.id === id || item.user_id === id)) {
        const userDetail = participants.find((participant) => participant.id === id || participant.user_id === id);
        if (userDetail) {
          setChecked(checked.concat([userDetail]));
        }
      } else {
        setChecked(checked.filter((item) => item.user_id !== id && item.id !== id));
      }
    }
  }

  function renderParticipantEntry(presenceEntry) {
    const {
      user_id: userId, name, email, id
    } = presenceEntry;
    const useId = userId || id;
    const isChecked = !_.isEmpty(checked.find((item) => (id && item.id === id) ||
      (userId && item.user_id === userId)));
    return (
      <ListItem
        key={useId}
        onClick={getCheckToggle(useId)}
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
            name={name}
            typographyVariant="caption"
            typographyClassName={classes.avatarName}
          />
        </ListItemText>
      </ListItem>
    )
  }

  function onSearchChange(event) {
    const { value } = event.target;
    const searchValueLower = value.toLowerCase();
    const filteredEntries = participants.filter((entry) => {
      const { name } = entry;
      const nameLower = name.toLowerCase();
      let index = 0;
      for (const c of searchValueLower) {
        const foundIndex = _.indexOf(nameLower, c, index);
        if (foundIndex < 0) {
          return false;
        }
        index = foundIndex;
      }
      return true;
    })
    setFilteredNames(filteredEntries);
  }

  return (
    <List
      dense
      className={clsx(classes.scrollableList, classes.sharedForm)}
      style={{paddingTop: 0, paddingBottom: 0, overflowX: 'hidden'}}
    >
      <ListItem className={classes.searchContainer} key="search">
        {_.size(participants) > 10 && (
          <ListItemText>
            <TextField
              className={classes.search}
              placeholder="Search"
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
        {filteredNames.map((entry) => renderParticipantEntry(entry))}
      </List>
    </List>
  );
}

IdentityList.propTypes = {
  participants: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default IdentityList;