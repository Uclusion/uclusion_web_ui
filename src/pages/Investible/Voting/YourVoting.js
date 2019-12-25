import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Paper, Button } from '@material-ui/core';
import AddEditVote from './AddEditVote';
import { DECISION_TYPE, PLANNING_TYPE } from '../../../constants/markets';
import { useIntl } from 'react-intl';


function YourVoting(props) {
  const {
    marketPresences,
    comments,
    investibleId,
    market,
    userId,
    showBudget,
  } = props;
  const intl = useIntl();

  const { market_type, id: marketId, max_budget: storyMaxBudget } = market;
  const yourPresence = marketPresences.find((presence) => presence.current_user);
  const yourVote = yourPresence && yourPresence.investments.find((investment) => investment.investible_id === investibleId);
  const yourReason = comments.find((comment) => comment.created_by === userId);
  const [voteForThis, setVoteForThis] = useState(undefined);

  function getVotingActionId(){
    switch(market_type) {
      case PLANNING_TYPE:
        return 'yourVotingVoteForThisPlanning';
      case DECISION_TYPE:
        return 'yourVotingVoteForThisDecision';
      default: //also initiative
        return 'yourVotingVoteForThisInitiative';
    }
  }

  if (yourVote || voteForThis === investibleId) {
    return (
      <AddEditVote
        marketId={marketId}
        investibleId={investibleId}
        onCancel={() => setVoteForThis(undefined)}
        reason={yourReason}
        investment={yourVote}
        showBudget={showBudget}
        storyMaxBudget={storyMaxBudget}
      />
    );
  }

  return (
    <Paper>
      <Button
        onClick={() => setVoteForThis(investibleId)}
      >
        {intl.formatMessage( { id: getVotingActionId()})}
      </Button>
    </Paper>
  );
}

YourVoting.propTypes = {
  userId: PropTypes.string.isRequired,
  investibleId: PropTypes.string.isRequired,
  market: PropTypes.object.isRequired,
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  comments: PropTypes.arrayOf(PropTypes.object),
  showBudget: PropTypes.bool,
};

YourVoting.defaultProps = {
  showBudget: false,
  comments: [],
  marketPresences: [],
};

export default YourVoting;