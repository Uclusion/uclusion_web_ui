import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { Checkbox, List, ListItem, ListItemIcon, ListItemText, ListSubheader, makeStyles, } from '@material-ui/core'
import { useIntl } from 'react-intl'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMyUserForMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'

const useStyles = makeStyles((theme) => ({
  name: {},
  disabled: {
    color: theme.palette.text.disabled,
  },
}));

function AssignmentList(props) {
  const {
    marketId,
    onChange,
    previouslyAssigned,
  } = props;

  const classes = useStyles();
  const intl = useIntl();

  const [marketPresencesState] = useContext(MarketPresencesContext);
  const fullMarketPresences = getMarketPresences(marketPresencesState, marketId) || {};
  const marketPresences = fullMarketPresences.filter((presence) => !presence.market_banned);
  const [marketsState] = useContext(MarketsContext);
  const userId = getMyUserForMarket(marketsState, marketId) || {};

  function getDefaultChecked() {
    if (!_.isEmpty(previouslyAssigned)) {
      return previouslyAssigned.reduce((acc, id) => ({
        ...acc,
        [id]: true,
      }), {});
    }
    return { [userId]: true };
  }

  const [checked, setChecked] = useState(getDefaultChecked());
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
        assignable: presence.following,
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

  function renderParticipantEntry(presenceEntry) {
    const { name, assignable, id } = presenceEntry;
    const alreadyAssigned = previouslyAssigned.includes(id);
    const canBeAssigned = alreadyAssigned || assignable;
    const boxChecked = (canBeAssigned && checked[id]);
    return (
      <ListItem
        key={id}
        button
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

  const participantEntries = getSortedPresenceWithAssignable();

  return (
    <List
      dense
    >
      <ListSubheader>
        {intl.formatMessage({ id: 'assignmentListHeader' })}
      </ListSubheader>
      {participantEntries.map((entry) => renderParticipantEntry(entry))}
    </List>
  );
}

AssignmentList.propTypes = {
  marketId: PropTypes.string.isRequired,
  previouslyAssigned: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func,
};

AssignmentList.defaultProps = {
  onChange: () => {
  },
  previouslyAssigned: [],
};

export default AssignmentList;
