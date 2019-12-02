import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  makeStyles } from '@material-ui/core';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getStages } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { ISSUE_TYPE } from '../../../constants/comments';
import { useIntl } from 'react-intl';

const BLOCKED_STATE = 'BLOCKED';
const ACCEPTED_STATE = 'ACCEPTED';
const ASSIGNED_STATE = 'ASSIGNED';
const UNKNOWN_STATE = 'UNKNOWN';


const useStyles = makeStyles((theme) => {
  return {
    name: {},
    disabled: {
      color: theme.palette.text.disabled,
    },
  };
});

function AssignmentList(props) {

  const {
    marketId,
    onChange,
    previouslyAssigned,
  } = props;

  const classes = useStyles();
  const intl = useIntl();

  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const participantPresences = marketPresences.filter((presence) => presence.following);

  const [investiblesState] = useContext(InvestiblesContext);
  const marketInvestibles = getMarketInvestibles(investiblesState, marketId);

  const [marketStagesState] = useContext(MarketStagesContext);
  const marketStages = getStages(marketStagesState, marketId);
  const acceptedStage = marketStages.find((stage) => (!stage.allows_investment && stage.allows_refunds));
  const inDialogStage = marketStages.find((stage) => (stage.appears_in_market_summary));

  const [commentsState] = useContext(CommentsContext);
  const marketComments = getMarketComments(commentsState, marketId);

  const defaultChecked = previouslyAssigned.reduce((acc, id) => {
    return {
      ...acc,
      [id]: true,
    };
  }, {});

  const [checked, setChecked] = useState(defaultChecked);

  function getInvestibleState(investibleId, stageId) {
    const blockingComment = marketComments.find((comment) => comment.investible_id === investibleId && comment.comment_type === ISSUE_TYPE);
    if (blockingComment) {
      return BLOCKED_STATE;
    }
    if (stageId === acceptedStage.id) {
      return ACCEPTED_STATE;
    }
    if (stageId === inDialogStage.id) {
      return ASSIGNED_STATE;
    }
    return UNKNOWN_STATE;
  }

  /**
   * For each participant presences computes an array of assignments to the person.
   * Assignments array will contain entries of the form { investibleId, state: [BLOCKED | ACCEPTED | ASSIGNED]}
   * Returns an object keyed by the market presence id, containing the above computed array.
   */
  function computeAssignments() {
    return participantPresences.reduce((acc, presence) => {
      const { id: presenceId } = presence;
      const assignments = marketInvestibles.filter((inv) => {
        const info = inv.market_infos.find((info) => info.market_id === marketId);
        const { assigned } = info;
        return assigned && assigned.includes(presenceId);
      });
      const filledAssignments = assignments.map((inv) => {
        const { investible, market_infos } = inv;
        const info = market_infos.find((info) => info.market_id === marketId);
        const { stage } = info;
        const { id: investibleId } = investible;
        const state = getInvestibleState(investibleId, stage);
        return {
          investibleId,
          state
        };
      });
      return {
        ...acc,
        [presenceId]: filledAssignments,
      };
    }, {});
  }

  function getSortedPresenceWithAssignable() {
    const sortedParticipants = _.sortBy(participantPresences, 'name');
    const assignments = computeAssignments();
    // console.log(assignments);
    return sortedParticipants.map((presence) => {
      const { id: presenceId } = presence;
      // console.log(presenceId);
      // console.log(name);
      const presenceAssignments = assignments[presenceId];
      // console.log(presenceAssignments);
      const assigned = presenceAssignments && presenceAssignments.find((assignment) => assignment.state === ASSIGNED_STATE);
      return {
        ...presence,
        assignable: !assigned,
      };
    });
  }

  function getCheckToggle(canBeAssigned, id) {
    if (canBeAssigned) {
      return () => {
        const newChecked = {
          ...checked,
          [id]: !checked[id]
        };
        setChecked(newChecked);
        const checkedIds = Object.keys(newChecked).filter((key) => newChecked[key]);
        onChange(checkedIds);
      };
    }
    return () => {};
  }

  function renderParticipantEntry(presenceEntry) {
    const { name, assignable, id } = presenceEntry;
    const alreadyAssigned = previouslyAssigned.includes(id);
    const canBeAssigned = alreadyAssigned || assignable;
    const boxChecked = (canBeAssigned && checked[id])
    return (
      <ListItem
        key={id}
        onClick={getCheckToggle(canBeAssigned, id)}
      >
        <ListItemIcon>
          <Checkbox
            disabled={!canBeAssigned}
            checked={boxChecked}
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
        {intl.formatMessage({ id: 'assignmentListHeader'})}
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
  onChange: () => {},
  previouslyAssigned: [],
};

export default AssignmentList;
