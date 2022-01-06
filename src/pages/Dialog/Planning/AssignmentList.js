import React, { useState } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import clsx from 'clsx'
import {
  Checkbox,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  makeStyles,
  TextField
} from '@material-ui/core'
import SearchIcon from '@material-ui/icons/Search'
import { useIntl } from 'react-intl'
import { usePlanFormStyles } from '../../../components/AgilePlan'
import Typography from '@material-ui/core/Typography'

const useStyles = makeStyles(() => ({
  name: {
    width: '50%',
  },
  scrollContainerHeight: {
    height: '230px'
  }
}));

function AssignmentList(props) {
  const {
    fullMarketPresences,
    onChange,
    previouslyAssigned,
    listHeader,
    requiresInput
  } = props;

  const classes = useStyles();
  const intl = useIntl();
  const marketPresences = fullMarketPresences.filter((presence) => !presence.market_banned);
  const formClasses = usePlanFormStyles();

  function getDefaultChecked() {
    if (!_.isEmpty(previouslyAssigned)) {
      return previouslyAssigned.reduce((acc, id) => ({
        ...acc,
        [id]: true,
      }), {});
    }
    return {};
  }

  function getSortedPresenceWithAssignable() {
    return _.sortBy(marketPresences, 'name');
  }

  const participants = getSortedPresenceWithAssignable();
  const [filteredNames, setFilteredNames] = useState(undefined);
  const [submitted, setSubmitted] = useState(getDefaultChecked());

  function getCheckToggle(id) {
    const newChecked = {
      ...submitted,
      [id]: !submitted[id],
    };
    if (submitted !== newChecked) {
      setSubmitted(newChecked);
      const checkedIds = Object.keys(newChecked).filter((key) => newChecked[key]);
      onChange(checkedIds);
    }
  }
  function onSearchChange (event) {
    const { value } = event.target;
    if (_.isEmpty(value)) {
      setFilteredNames(undefined);
    } else if (participants) {
      const searchValueLower = value.toLowerCase();
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
      if(filteredNames === undefined || filteredEntries.length !== filteredNames.length){
        setFilteredNames(filteredEntries);
      }
    }
  }
  function renderParticipantEntry(presenceEntry) {
    const { name, id, email } = presenceEntry;
    const boxChecked = submitted[id];
    // Using id email for Cypress tests
    return (
      <ListItem
        key={id}
        id={email}
        button
        onClick={() => getCheckToggle(id)}
        className={ boxChecked ? clsx( formClasses.unselected, formClasses.selected ) : formClasses.unselected }
      >
        <ListItemIcon>
          <Checkbox
            value={!!boxChecked}
            checked={!!boxChecked}
          />
        </ListItemIcon>
        <ListItemText
          className={classes.name}
        >
          {name}
        </ListItemText>
      </ListItem>
    );
  }

  function renderAssignedEntry(presenceEntry) {
    const { name, id } = presenceEntry;
    if (!submitted[id]) {
      return React.Fragment;
    }
    return (
      <ListItem key={`assigned${id}`}>
        <ListItemText
          className={classes.name}
        >
          {name}
        </ListItemText>
      </ListItem>
    );
  }

  const displayNames = filteredNames || participants || [];

  return (
    <List
      dense
      className={clsx(formClasses.scrollableList, formClasses.sharedForm)}
    >
      {participants && participants.length > 10 && (
        <ListItem className={formClasses.searchContainer} key="search">
          <ListItemText >
            <TextField
              className={formClasses.search}
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
      )}

      <List
          dense
          id="addressBook"
          className={clsx(formClasses.scrollContainer, classes.scrollContainerHeight)}
        >
      {displayNames.map((entry) => renderParticipantEntry(entry))}
      </List>
      {requiresInput && (
        <Typography color='error' style={{paddingLeft: '1rem'}}>
          {intl.formatMessage({ id: 'requiresInputListHeader' })}
        </Typography>
      )}
      <ListSubheader>
        {intl.formatMessage({ id: listHeader })}
      </ListSubheader>
      <List
        dense
        id="addressBook"
      >
        {participants.map((entry) => renderAssignedEntry(entry))}
      </List>
    </List>
  );
}

AssignmentList.propTypes = {
  fullMarketPresences: PropTypes.arrayOf(PropTypes.object),
  listHeader: PropTypes.string,
  previouslyAssigned: PropTypes.arrayOf(PropTypes.string),
  cannotBeAssigned: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func,
  requiresInput: PropTypes.bool
};

AssignmentList.defaultProps = {
  listHeader: 'assignmentListHeader',
  onChange: () => {
  },
  previouslyAssigned: [],
  cannotBeAssigned: [],
  requiresInput: false
};

export default AssignmentList;
