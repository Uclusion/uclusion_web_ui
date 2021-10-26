import React, { useContext, useState } from 'react'
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
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { usePlanFormStyles } from '../../../components/AgilePlan'
import Typography from '@material-ui/core/Typography'

const useStyles = makeStyles((theme) => ({
  name: {
    width: '50%',
  },
  disabled: {
    color: theme.palette.text.disabled,
  },
  scrollContainerHeight: {
    height: '230px'
  }
}));

function AssignmentList(props) {
  const {
    marketId,
    onChange,
    previouslyAssigned,
    cannotBeAssigned,
    listHeader,
    requiresInput
  } = props;

  const classes = useStyles();
  const intl = useIntl();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const fullMarketPresences = getMarketPresences(marketPresencesState, marketId) || {};
  const marketPresences = fullMarketPresences.filter((presence) => !presence.market_banned && !presence.market_guest);
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

  const participantEntries = getSortedPresenceWithAssignable();
  const [participants, ] = useState(participantEntries)
  const [filteredNames, setFilteredNames] = useState(undefined);
  const [submitted, setSubmitted] = useState(getDefaultChecked());

  function getSortedPresenceWithAssignable() {
    const sortedParticipants = _.sortBy(marketPresences, 'name');
    return sortedParticipants.map((presence) => {
      return {
        ...presence,
        assignable: (presence.following && !cannotBeAssigned.includes(presence.id)),
      };
    });
  }

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
    const { name, assignable, id } = presenceEntry;
    const boxChecked = submitted[id];
    return (
      <ListItem
        key={id}
        button
        onClick={() => {
          if (assignable) {
            getCheckToggle(id);
          }
        }}
        className={ boxChecked ? clsx( formClasses.unselected, formClasses.selected ) : formClasses.unselected }
      >
        <ListItemIcon>
          <Checkbox
            value={!!boxChecked}
            disabled={!assignable}
            checked={!!boxChecked}
          />
        </ListItemIcon>
        <ListItemText
          className={assignable ? classes.name : classes.disabled}
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
      className={clsx(formClasses.scrollableList, formClasses.sharedForm, formClasses.paddingRight)}
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
  marketId: PropTypes.string.isRequired,
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
