import React, { useState } from 'react'
import PropTypes from 'prop-types'
import AddEditVote from './AddEditVote'
import { useHistory } from 'react-router'
import { formMarketLink, navigate } from '../../../utils/marketIdPathFunctions'
import { FormattedMessage, useIntl } from 'react-intl'
import { DECISION_TYPE, INITIATIVE_TYPE } from '../../../constants/markets'
import { Card, CardContent, FormControl, FormControlLabel, Radio, RadioGroup } from '@material-ui/core'
import { useStyles } from '../../../containers/CommentBox/CommentAddBox'

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
  const isDecision = marketType === DECISION_TYPE;
  let yourPresence = marketPresences.find((presence) => presence.current_user);
  let yourVote = yourPresence && yourPresence.investments.find((investment) => investment.investible_id === investibleId);
  const { quantity } = yourVote || {};
  const myQuantity = quantity ? quantity : 0;
  const yourReason = comments.find((comment) => comment.created_by === userId);
  const [type, setType] = useState(isInitiative && myQuantity === 0 ? undefined : myQuantity < 0 ? AGAINST : FOR);
  if (isInitiative || isDecision) {
    if (yourVote && yourVote.deleted) {
      yourVote = undefined;
    }
    if (yourPresence && yourPresence.investments) {
      yourPresence.investments = yourPresence.investments.filter((investment) => !investment.deleted);
    }
  }
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
    <div  id="pleaseVote">
      <h2>{yourVote ? isInitiative ? intl.formatMessage({ id: 'changeVoteInitiative' })
        : yourVote.deleted ? intl.formatMessage({ id: 'voteDeletedStory' }) : intl.formatMessage({ id: 'changeVote' })
        : isDecision ? allowMultiVote ? intl.formatMessage({ id: 'addMultiVote' })
        : intl.formatMessage({ id: 'addAVote' }) : isInitiative ? intl.formatMessage({ id: 'pleaseVote' })
        : intl.formatMessage({ id: 'pleaseVoteStory' }) }</h2>
      {isInitiative && (
        <Card elevation={0}>
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
                  className={`${type === FOR || type === undefined ? classes.selected : classes.unselected} ${classes.chipItem} ${classes.chipItemFor}`}
                  /* prevent clicking the label stealing focus */
                  onMouseDown={e => e.preventDefault()}
                  control={<Radio />}
                  label={<FormattedMessage id="voteFor" />}
                  labelPlacement="end"
                  value={FOR}
                />
                <FormControlLabel
                  key="against"
                  className={`${type === AGAINST || type === undefined ? classes.selected : classes.unselected} ${classes.chipItem} ${classes.chipItemAgainst}`}
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
      )}
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
        multiplier={ type === undefined ? undefined : type === FOR ? 1 : -1}
      />
    </div>
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