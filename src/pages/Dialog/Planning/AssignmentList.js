import React, { useContext, useEffect, useState } from 'react'
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
import { getMyUserForMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { usePlanFormStyles } from '../../../components/AgilePlan'

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
    checkMeByDefault,
    listHeader
  } = props;

  const classes = useStyles();
  const intl = useIntl();

  const [marketPresencesState] = useContext(MarketPresencesContext);
  const fullMarketPresences = getMarketPresences(marketPresencesState, marketId) || {};
  const marketPresences = fullMarketPresences.filter((presence) => !presence.market_banned);
  const [marketsState] = useContext(MarketsContext);
  const userId = getMyUserForMarket(marketsState, marketId) || {};
  const formClasses = usePlanFormStyles();

  function getDefaultChecked() {
    if (!_.isEmpty(previouslyAssigned)) {
      return previouslyAssigned.reduce((acc, id) => ({
        ...acc,
        [id]: true,
      }), {});
    }
    if (checkMeByDefault) {
      return { [userId]: true };
    }
    return {};
  }

  const participantEntries = getSortedPresenceWithAssignable();
  const [checked, setChecked] = useState(getDefaultChecked());
  const [searchValue, setSearchValue] = useState(undefined);
  const [participants, ] = useState(participantEntries)
  const [filteredNames, setFilteredNames] = useState(undefined);
  const [submitted, setSubmitted] = useState(getDefaultChecked());

  useEffect(() => {
    if (submitted !== checked) {
      setSubmitted(checked);
      const checkedIds = Object.keys(checked).filter((key) => checked[key]);
      onChange(checkedIds);
    }
  }, [checked, onChange, submitted]);

  function getSortedPresenceWithAssignable() {
    const sortedParticipants = _.sortBy(marketPresences, 'name');
    return sortedParticipants.map((presence) => {
      return {
        ...presence,
        assignable: (presence.following && !cannotBeAssigned.includes(presence.id)),
      };
    });
  }

  function getCheckToggle(canBeAssigned, id) {
    if (canBeAssigned) {
      return () => {
        const newChecked = {
          ...checked,
          [id]: !checked[id],
        };
        setChecked(newChecked);
      };
    }
    return () => {
    };
  }
  function onSearchChange (event) {
    const { value } = event.target;
    setSearchValue(value);
  }
  function renderParticipantEntry(presenceEntry) {
    const { name, assignable, id } = presenceEntry;
    const alreadyAssigned = previouslyAssigned.includes(id);
    const canBeAssigned = alreadyAssigned || assignable;
    const boxChecked = (canBeAssigned && checked[id]);
    return (
      <ListItem
        key={id}
        button
        className={ boxChecked ? clsx( formClasses.unselected, formClasses.selected ) : formClasses.unselected }
        onClick={getCheckToggle(canBeAssigned, id)}
      >
        <ListItemIcon>
          <Checkbox
            value={!!boxChecked}
            disabled={!canBeAssigned}
            checked={!!boxChecked}
          />
        </ListItemIcon>
        <ListItemText
          className={canBeAssigned ? classes.name : classes.disabled}
        >
          {name}
        </ListItemText>
      </ListItem>
    );
  }


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
      if(filteredNames === undefined || filteredEntries.length !== filteredNames.length){
        setFilteredNames(filteredEntries);
      }
    }
  }, [searchValue, participants, filteredNames]);

  const displayNames = filteredNames || participants || [];

  return (
    <List
    dense
    className={clsx(formClasses.scrollableList, formClasses.sharedForm, formClasses.paddingRight)}
  >
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
      <ListSubheader>
        {intl.formatMessage({ id: listHeader })}
      </ListSubheader>
      <List
          dense
          id="addressBook"
          className={clsx(formClasses.scrollContainer, classes.scrollContainerHeight)}
        >
      {displayNames.map((entry) => renderParticipantEntry(entry))}
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
  checkMeByDefault: PropTypes.bool
};

AssignmentList.defaultProps = {
  checkMeByDefault: false,
  listHeader: 'assignmentListHeader',
  onChange: () => {
  },
  previouslyAssigned: [],
  cannotBeAssigned: []
};

export default AssignmentList;
