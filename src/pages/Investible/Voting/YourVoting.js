import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import AddEditVote from './AddEditVote'
import { FormattedMessage, useIntl } from 'react-intl'
import { DECISION_TYPE, INITIATIVE_TYPE } from '../../../constants/markets'
import { Card, CardContent, FormControl, FormControlLabel, Radio, RadioGroup } from '@material-ui/core'
import { useStyles } from '../../../containers/CommentBox/CommentAddBox'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import { makeStyles } from '@material-ui/styles'
import { NOT_FULLY_VOTED_TYPE } from '../../../constants/notifications'
import { findMessageOfType } from '../../../utils/messageUtils'
import { getPageReducerPage, usePageStateReducer } from '../../../components/PageState/pageStateHooks'

const FOR = "FOR";
const AGAINST = "AGAINST";


const useMyStyles = makeStyles(
  () => {
    return {
      containerYellow: {
        boxShadow: "4px 4px 4px yellow",
        overflow: "visible",
        marginBottom: "1.5rem"
      },
    }
  },
  { name: "Voting" }
);

function YourVoting(props) {
  const {
    marketPresences,
    comments,
    investibleId,
    market,
    userId,
    isAssigned,
    votingPageState, updateVotingPageState, votingPageStateReset,
    isInbox
  } = props;
  const [votingPageStateFull, votingPageDispatch] = usePageStateReducer('voting');
  const [myVotingPageState, myUpdateVotingPageState, myVotingPageStateReset] =
    getPageReducerPage(votingPageStateFull, votingPageDispatch, investibleId);
  const {
    storedType,
  } = votingPageState || myVotingPageState;
  const [messagesState] = useContext(NotificationsContext);
  const voteMessage = findMessageOfType(NOT_FULLY_VOTED_TYPE, investibleId, messagesState);
  const intl = useIntl();
  const classes = useStyles();
  const myClasses = useMyStyles()
  const { id: marketId, allow_multi_vote: allowMultiVote, market_type: marketType } = market
  const isInitiative = marketType === INITIATIVE_TYPE
  const isDecision = marketType === DECISION_TYPE;
  let yourPresence = marketPresences.find((presence) => presence.current_user);
  let yourVote = yourPresence && yourPresence.investments && yourPresence.investments.find((investment) => investment.investible_id === investibleId);
  const { quantity } = yourVote || {};
  const myQuantity = quantity ? quantity : 0;
  const yourReason = comments.find((comment) => comment.created_by === userId && comment.investible_id === investibleId);
  const initialType = isInitiative && myQuantity === 0 ? undefined : myQuantity < 0 ? AGAINST : FOR;
  const type = storedType || initialType;
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
    if (updateVotingPageState) {
      updateVotingPageState({storedType: value});
    } else {
      myUpdateVotingPageState({storedType: value});
    }
  }

  return (
    <div  id="pleaseVote" className={voteMessage && myClasses.containerYellow}>
      {yourVote && yourVote.deleted && (
        <h3>{intl.formatMessage({ id: 'voteDeletedStory' })}</h3>
      )}
      {!yourVote && !isAssigned && (
        <h3>{isDecision ? allowMultiVote ? intl.formatMessage({ id: 'addMultiVote' })
            : intl.formatMessage({ id: 'addAVote' }) : isInitiative ? intl.formatMessage({ id: 'pleaseVote' })
            : intl.formatMessage({ id: 'pleaseVoteStory' }) }</h3>
      )}
      {isInitiative && (
        <Card elevation={0}>
          <CardContent>
            <FormControl component="fieldset" className={classes.commentType} style={{paddingTop: 0}}>
              <RadioGroup
                aria-labelledby="comment-type-choice"
                className={classes.commentTypeGroup}
                onChange={onTypeChange}
                value={type}
                row
              >
                <FormControlLabel
                  key="for"
                  id="for"
                  className={`${type === FOR ? classes.selected : classes.unselected} ${classes.chipItem} ${classes.chipItemFor}`}
                  /* prevent clicking the label stealing focus */
                  onMouseDown={e => e.preventDefault()}
                  control={<Radio />}
                  label={<FormattedMessage id="voteFor" />}
                  labelPlacement="end"
                  value={FOR}
                />
                <FormControlLabel
                  key="against"
                  id="against"
                  className={`${type === AGAINST ? classes.selected : classes.unselected} ${classes.chipItem} ${classes.chipItemAgainst}`}
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
        hasVoted={yourPresence && yourPresence.investments && yourPresence.investments.length > 0}
        allowMultiVote={allowMultiVote}
        showBudget={market.use_budget}
        marketBudgetUnit={market.budget_unit}
        multiplier={type === undefined ? undefined : type === FOR ? 1 : -1}
        votingPageState={votingPageState || myVotingPageState}
        updateVotingPageState={updateVotingPageState || myUpdateVotingPageState}
        votingPageStateReset={votingPageStateReset || myVotingPageStateReset}
        voteMessage={voteMessage}
        isInbox={isInbox}
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