import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox'
import { addCommentToMarket, getCommentRoot } from '../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketInfo } from '../../../utils/userFunctions'
import { getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { useHistory } from 'react-router'
import { wizardFinish } from '../InboxWizardUtils'
import { formCommentLink } from '../../../utils/marketIdPathFunctions'
import { removeWorkListItem, workListStyles } from '../../../pages/Home/YourWork/WorkListItem'
import { resolveComment, updateComment } from '../../../api/comments'
import { TODO_TYPE } from '../../../constants/comments'


function DecideAcceptRejectStep(props) {
  const { marketId, commentId, message } = props;
  const [commentState] = useContext(CommentsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const history = useHistory();
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const workItemClasses = workListStyles();
  const inv = commentRoot.investible_id ? getInvestible(investibleState, commentRoot.investible_id) : {} ;
  const { investible: myInvestible } = inv;
  const { name } = myInvestible || {};
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage } = marketInfo;
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};

  function myOnFinish() {
    wizardFinish({link: formCommentLink(marketId, commentRoot.group_id, commentRoot.investible_id,
          commentRoot.id)},
      setOperationRunning, message, history);
  }

  function accept() {
    return updateComment(marketId, commentId, undefined, TODO_TYPE).then((comment) => {
      addCommentToMarket(comment, commentsState, commentsDispatch);
      removeWorkListItem(message, workItemClasses.removed);
      setOperationRunning(false);
    })
  }

  function resolve() {
    return resolveComment(marketId, commentId)
      .then((comment) => {
        addCommentToMarket(comment, commentsState, commentsDispatch);
        removeWorkListItem(message, workItemClasses.removed);
        setOperationRunning(false);
      });
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        Do you accept this suggestion for "{name}"?
      </Typography>
      <div style={{paddingBottom: '1rem'}}>
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
        onFinish={myOnFinish}
        nextLabel="planningAcceptLabel"
        onNext={accept}
        showOtherNext
        otherNextLabel="saveReject"
        onOtherNext={resolve}
        showTerminate={true}
        terminateLabel="JobWizardGotoJob"
      />
    </div>
    </WizardStepContainer>
  );
}

DecideAcceptRejectStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideAcceptRejectStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideAcceptRejectStep;