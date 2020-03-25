import React, { useState } from 'react'
import PropTypes from 'prop-types';
import AddEditVote from './AddEditVote';
import { useHistory } from 'react-router';
import { formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';
import { FormattedMessage, useIntl } from 'react-intl';
import { INITIATIVE_TYPE } from '../../../constants/markets';
import { Card, CardContent, FormControl, FormControlLabel, Radio, RadioGroup } from '@material-ui/core'
import { useStyles } from '../../../containers/CommentBox/CommentAddBox';

const FOR = "FOR";
const AGAINST = "AGAINST";

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
  const history = useHistory();
  const classes = useStyles();
  const { id: marketId, max_budget: storyMaxBudget, allow_multi_vote: allowMultiVote, market_type: marketType } = market;
  const isInitiative = marketType === INITIATIVE_TYPE;
  const yourPresence = marketPresences.find((presence) => presence.current_user);
  const yourVote = yourPresence && yourPresence.investments.find((investment) => investment.investible_id === investibleId);
  const { quantity } = yourVote || {};
  const myQuantity = quantity ? quantity : 0;
  const yourReason = comments.find((comment) => comment.created_by === userId);
  const [type, setType] = useState(myQuantity < 0 ? AGAINST : FOR);

  function onTypeChange(event) {
    const { value } = event.target;
    setType(value);
  }

  function onVoteSave() {
    if (!isInitiative) {
      navigate(history, formMarketLink(marketId));
    }
  }

  return (
    <>
      <h2>{yourVote ? intl.formatMessage({ id: 'changeVote' }) : intl.formatMessage({ id: 'addAVote' })}</h2>
      <Card>
        <CardContent>
          <FormControl component="fieldset" className={classes.commentType}>
            <RadioGroup
              aria-labelledby="comment-type-choice"
              className={classes.commentTypeGroup}
              onChange={onTypeChange}
              value={type}
              row
            >
              <FormControlLabel
                key="for"
                className={`${classes.chipItem} ${classes.chipItemFor}`}
                /* prevent clicking the label stealing focus */
                onMouseDown={e => e.preventDefault()}
                control={<Radio />}
                label={<FormattedMessage id="voteFor" />}
                labelPlacement="end"
                value={FOR}
              />
              <FormControlLabel
                key="against"
                className={`${classes.chipItem} ${classes.chipItemAgainst}`}
                /* prevent clicking the label stealing focus */
                onMouseDown={e => e.preventDefault()}
                control={<Radio color="primary" />}
                label={<FormattedMessage id="voteAgainst" />}
                labelPlacement="end"
                value={AGAINST}
              />
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>
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
        multiplier={type === FOR ? 1 : -1}
      />
    </>
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