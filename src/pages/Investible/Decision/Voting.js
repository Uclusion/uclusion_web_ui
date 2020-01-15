import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useIntl } from 'react-intl';
import { Paper, Typography } from '@material-ui/core';
import ReadOnlyQuillEditor from '../../../components/TextEditors/ReadOnlyQuillEditor';

/**
 * The voting for an investible screen is the detail. It lists the people,
 * their certainty and their reasons
 * @constructor
 */
function Voting(props) {
  const { marketPresences, investibleId, investmentReasons } = props;
  const intl = useIntl();
  function getInvestibleVoters() {
    const acc = [];
    marketPresences.forEach((presence) => {
      const { name, id, investments } = presence;
      investments.forEach((investment) => {
        const { quantity, investible_id: invId, max_budget: maxBudget } = investment;
        // console.debug(investment);
        if (investibleId === invId) {
          acc.push({ name, userId: id, quantity, maxBudget });
        }
      });
    });
    return acc;
  }

  function getInvestmentConfidence(quantity) {
    if (quantity === 100) {
      return intl.formatMessage({ id: 'veryCertain' });
    }
    if (quantity >= 75) {
      return intl.formatMessage({ id: 'certain' });
    }
    if (quantity >= 50) {
      return intl.formatMessage({ id: 'somewhatCertain' });
    }
    if (quantity >= 25) {
      return intl.formatMessage({ id: 'somewhatUncertain' });
    }
    return intl.formatMessage({ id: 'uncertain' });
  }

  function getVoterReason(userId) {
    return investmentReasons.find((comment) => comment.created_by === userId);
  }

  function renderInvestibleVoters(voters) {
    return voters.map((voter) => {
      const {
        name, userId, quantity, maxBudget,
      } = voter;
      const reason = getVoterReason(userId);
      const voteId = `cv${userId}`;
      return (
        <Paper
          key={userId}
          id={voteId}
        >
          <Typography>
            {name}
          </Typography>
          <Typography>
            {getInvestmentConfidence(quantity)}
          </Typography>
          {maxBudget > 0 && (
            <Typography>
              {intl.formatMessage({ id: 'maxBudget' }, { x: maxBudget })}
            </Typography>
          )}
          {reason && (
            <ReadOnlyQuillEditor
              value={reason.body}
            />
          )}
        </Paper>
      );
    });
  }

  const voters = getInvestibleVoters();
  const sortedVoters = _.sortBy(voters, 'name');

  return (
    <Paper>
      {renderInvestibleVoters(sortedVoters)}
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
