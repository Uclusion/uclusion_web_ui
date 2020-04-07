import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { Checkbox, List, ListItem, ListItemIcon, ListItemText, ListSubheader, makeStyles, } from '@material-ui/core'
import { useIntl } from 'react-intl'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import {
  getAcceptedStage,
  getBlockedStage,
  getInCurrentVotingStage,
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { getMyUserForMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'

const BLOCKED_STATE = 'BLOCKED';
const ACCEPTED_STATE = 'ACCEPTED';
const ASSIGNED_STATE = 'ASSIGNED';
const UNKNOWN_STATE = 'UNKNOWN';


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
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || {};
  const [investiblesState] = useContext(InvestiblesContext);
  const marketInvestibles = getMarketInvestibles(investiblesState, marketId);

  const [marketStagesState] = useContext(MarketStagesContext);

  const acceptedStage = getAcceptedStage(marketStagesState, marketId);
  const assignedStage = getInCurrentVotingStage(marketStagesState, marketId);
  const blockedStage = getBlockedStage(marketStagesState, marketId);
  const [marketsState] = useContext(MarketsContext);
  const userId = getMyUserForMarket(marketsState, marketId) || {};

  function getInvestibleState(investibleId, stageId) {
    if (stageId === blockedStage.id) {
      return BLOCKED_STATE;
    }
    if (stageId === acceptedStage.id) {
      return ACCEPTED_STATE;
    }
    if (stageId === assignedStage.id) {
      return ASSIGNED_STATE;
    }
    return UNKNOWN_STATE;
  }

  /**
   * For each participant presences computes an array of assignments to the person.
   * Assignments array will contain entries of the form
   * { investibleId, state: [BLOCKED | ACCEPTED | ASSIGNED]}
   * Returns an object keyed by the market presence id, containing the above computed array.
   */
  function computeAssignments() {
    return marketPresences.reduce((acc, presence) => {
      const { id: presenceId } = presence;
      const assignments = marketInvestibles.filter((inv) => {
        const info = inv.market_infos.find((info) => info.market_id === marketId);
        const { assigned } = info;
        return assigned && assigned.includes(presenceId);
      });
      const filledAssignments = assignments.map((inv) => {
        const { investible, market_infos: marketInfos } = inv;
        const info = marketInfos.find((info) => info.market_id === marketId);
        const { stage } = info;
        const { id: investibleId } = investible;
        const state = getInvestibleState(investibleId, stage);
        return {
          investibleId,
          state,
        };
      });
      return {
        ...acc,
        [presenceId]: filledAssignments,
      };
    }, {});
  }

  function getDefaultChecked() {
    if (!_.isEmpty(previouslyAssigned)) {
      return previouslyAssigned.reduce((acc, id) => ({
        ...acc,
        [id]: true,
      }), {});
    }
    const assignments = computeAssignments();
    const userAssignments = assignments[userId] || [];
    const assigned = userAssignments.find((assignment) => assignment.state === ASSIGNED_STATE);
    if (!assigned) {
      return { [userId]: true };
    }
    return {};
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
    const assignments = computeAssignments();
    // // console.log(assignments);
    return sortedParticipants.map((presence) => {
      const { id: presenceId } = presence;
      // // console.log(presenceId);
      // // console.log(name);
      const presenceAssignments = assignments[presenceId];
      // // console.log(presenceAssignments);
      const assigned = presenceAssignments
        && presenceAssignments.find((assignment) => assignment.state === ASSIGNED_STATE);
      return {
        ...presence,
        assignable: !assigned && presence.following,
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
