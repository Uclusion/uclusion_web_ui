import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox'
import { getCommentRoot } from '../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketInfo } from '../../../utils/userFunctions'
import { getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { marketAbstain } from '../../../api/markets'
import { changeMyPresence } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { removeMessagesForCommentId } from '../../../utils/messageUtils'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { useHistory } from 'react-router'
import { wizardFinish } from '../InboxWizardUtils'
import { formCommentLink } from '../../../utils/marketIdPathFunctions'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import { workListStyles } from '../../../pages/Home/YourWork/WorkListItem'


function DecideAnswerStep(props) {
  const { marketId, commentId, clearFormData, message } = props;
  const [commentState] = useContext(CommentsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketPresencesState, presenceDispatch] = useContext(MarketPresencesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const history = useHistory();
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const workItemClasses = workListStyles();
  const inv = commentRoot.investible_id ? getInvestible(investibleState, commentRoot.investible_id) : undefined;
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage } = marketInfo;
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};

  function myOnFinish() {
    wizardFinish({link: formCommentLink(marketId, commentRoot.group_id, commentRoot.investible_id,
          commentRoot.id)},
      setOperationRunning, message, history, marketId, commentRoot.investible_id, messagesDispatch);
  }

  function abstain() {
    setOperationRunning(true);
    return marketAbstain(commentRoot.inline_market_id)
      .then(() => {
        const newValues = {
          abstain: true,
        }
        changeMyPresence(marketPresencesState, presenceDispatch, marketId, newValues)
        removeMessagesForCommentId(commentId, messagesState, workItemClasses.removed)
        setOperationRunning(false)
        clearFormData();
      });
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        Can you help answer this question?
      </Typography>
      <div className={classes.wizardCommentBoxDiv}>
        <CommentBox
          comments={comments}
          marketId={marketId}
          allowedTypes={[]}
          fullStage={fullStage}
          investible={inv}
          marketInfo={marketInfo}
          isInbox
          removeActions
        />
      </div>
      <WizardStepButtons
        {...props}
        nextLabel="DecideWizardContinue"
        onNext={myOnFinish}
        showOtherNext
        otherNextLabel="DecideWizardMute"
        onOtherNext={abstain}
        showTerminate={false}
      />
    </div>
    </WizardStepContainer>
  );
}

DecideAnswerStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideAnswerStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideAnswerStep;