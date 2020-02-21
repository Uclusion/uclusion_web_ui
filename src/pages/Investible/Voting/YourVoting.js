import React from 'react';
import PropTypes from 'prop-types';
import AddEditVote from './AddEditVote';
import { useHistory } from 'react-router';
import { formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';

function YourVoting(props) {
  const {
    marketPresences,
    comments,
    investibleId,
    market,
    userId,
    showBudget,
  } = props;

  const history = useHistory();
  const { id: marketId, max_budget: storyMaxBudget, allow_multi_vote: allowMultiVote } = market;
  const yourPresence = marketPresences.find((presence) => presence.current_user);
  const yourVote = yourPresence && yourPresence.investments.find((investment) => investment.investible_id === investibleId);
  const yourReason = comments.find((comment) => comment.created_by === userId);

  function onVoteSave() {
    navigate(history, formMarketLink(marketId));
  }

  return (
    <AddEditVote
      marketId={marketId}
      investibleId={investibleId}
      reason={yourReason}
      investment={yourVote}
      hasVoted={yourPresence && yourPresence.investments.length > 0}
      allowMultiVote={allowMultiVote}
      showBudget={showBudget}
      onSave={onVoteSave}
      storyMaxBudget={storyMaxBudget}
    />
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