import React, { useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { JUSTIFY_TYPE } from '../../../constants/comments';
import { Paper, Typography } from '@material-ui/core';
import QuillEditor from '../../../components/TextEditors/QuillEditor';

/**
 * The voting for an investible screen is the detail. It lists the people,
 * their certainty and their reasons
 * @constructor
 */
function Voting(props) {

  const { marketPresences, investibleId, investmentReasons } = props;
  const [reasonText, setReasonText] = useState('');

  function getInvestmentReason(userId) {
    const comment = investmentReasons.find((comment) => {
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
        // console.debug(investment);
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

  function getInvestmentConfidence(quantity) {
    if (quantity === 100) {
      return 'Certain';
    }
    if (quantity >= 75) {
      return 'Very Certain';
    }
    if (quantity >= 50) {
      return 'Somewhat Certain';
    }
    if (quantity >= 25) {
      return 'Somewhat Uncertain';
    }
    return 'Uncertain';
  }

  function getVoterReason(userId) {
    return investmentReasons.find((comment) => comment.created_by === userId);
  }

  function renderInvestibleVoters(voters) {
    return voters.map((voter) => {
      const { name, userId, quantity } = voter;
      const reason = getVoterReason(userId);

      // console.debug(voter);
      return (
        <Paper
          key={userId}
          onClick={() => displayReason(userId)}
        >
          <Typography>
            {name}
          </Typography>
          <Typography>
            {getInvestmentConfidence(quantity)}
          </Typography>
          {reason && (
            <QuillEditor
              readOnly
              defaultValue={reason.body}
            />
          )}
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
  investmentReasons: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  investibleId: PropTypes.string.isRequired,
};

Voting.defaultProps = {
  investmentReasons: [],
  marketPresences: [],
};

export default Voting;


