import React, { useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { JUSTIFY_TYPE } from '../../../containers/CommentBox/CommentBox';
import { Paper, Typography } from '@material-ui/core';
import QuillEditor from '../../../components/TextEditors/QuillEditor';

/**
 * The voting for an investible screen is the detail. It lists the people,
 * their certainty and their reasons
 * @constructor
 */
function Voting(props) {

  const { marketPresences, investibleId, comments } = props;
  const [reasonText, setReasonText] = useState('');

  function getInvestmentReason(userId) {
    const comment = comments.find((comment) => {
      const forUser = comment.created_by === userId;
      const isReason = comment.type === JUSTIFY_TYPE;
      return forUser && isReason;
    });
    return comment;
  }

  function getInvestibleVoters() {
    const acc = [];
    marketPresences.forEach((presence) => {
      const { name, id, investments } = presence;
      investments.forEach((investment) => {
        const { quantity, investible_id: invId } = investment;
        console.log(investment);
        if (investibleId === invId) {
          acc.push({ name, userId: id, quantity });
        }
      });
    });
    return acc;
  }

  function displayReason(userId) {
    const reason = getInvestmentReason(userId);
    if (reason) {
      setReasonText(reason.body);
    }
  }

  function renderInvestibleVoters(voters) {
    return voters.map((voter) => {
      const { name, id, quantity } = voter;
      console.debug(voter);
      return (
        <Paper
          key={id}
          onClick={() => displayReason(id)}
        >
          <Typography>
            {name}
          </Typography>
          <Typography>
            {quantity}
          </Typography>
        </Paper>);
    });
  }

  const voters = getInvestibleVoters();
  const sortedVoters = _.sortBy(voters, 'name');
  
  return (
    <Paper>
      {renderInvestibleVoters(sortedVoters)}
      {reasonText && <QuillEditor readOnly defaultValue={reasonText} />}
    </Paper>
  );
}

Voting.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  comments: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  investibleId: PropTypes.string.isRequired,
};

Voting.defaultProps = {
  comments: [],
  marketPresences: [],
};

export default Voting;


