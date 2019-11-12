import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Paper, Button, Typography } from '@material-ui/core';
import AddEditVote from './AddEditVote';
import { JUSTIFY_TYPE } from '../../../../containers/CommentBox/CommentBox';

function YourVoting(props) {
  const {
    marketPresences,
    comments,
    investibleId,
    marketId,
    userId,
  } = props;

  const yourPresence = marketPresences.find((presence) => presence.current_user);
  const yourVote = yourPresence && yourPresence.investments.find((investment) => investment.investible_id === investibleId);
  const yourReason = comments.find((comment) => comment.created_by === userId && comment.type === JUSTIFY_TYPE);
  const [voteForThis, setVoteForThis] = useState(false);

  if (yourVote || voteForThis) {
    return (
      <AddEditVote
        marketId={marketId}
        investibleId={investibleId}
        onCancel={() => setVoteForThis(false)}
        reason={yourReason}
        investment={yourVote}
      />
    );
  }

  return (
    <Paper>
      <Typography>
        You are not voting for this option. (TODO: Put what you are voting for here)
      </Typography>
      <Button
        onClick={() => setVoteForThis(true)}
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
};

YourVoting.defaultProps = {
  comments: [],
  marketPresences: [],
};

export default YourVoting;