import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Paper, Button, Typography } from '@material-ui/core';
import AddEditVote from './AddEditVote';


function YourVoting(props) {
  const {
    marketPresences,
    comments,
    investibleId,
    marketId,
    userId,
    showBudget,
  } = props;

  const yourPresence = marketPresences.find((presence) => presence.current_user);
  const yourVote = yourPresence && yourPresence.investments.find((investment) => investment.investible_id === investibleId);
  const yourReason = comments.find((comment) => comment.created_by === userId);
  const [voteForThis, setVoteForThis] = useState(undefined);

  if (yourVote || voteForThis === investibleId) {
    return (
      <AddEditVote
        marketId={marketId}
        investibleId={investibleId}
        onCancel={() => setVoteForThis(undefined)}
        reason={yourReason}
        investment={yourVote}
        showBudget={showBudget}
      />
    );
  }

  return (
    <Paper>
      <Typography>
        You are not voting for this option.
      </Typography>
      <Button
        onClick={() => setVoteForThis(investibleId)}
      >
        Vote for this option
      </Button>
    </Paper>
  );
}

YourVoting.propTypes = {
  userId: PropTypes.string.isRequired,
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
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