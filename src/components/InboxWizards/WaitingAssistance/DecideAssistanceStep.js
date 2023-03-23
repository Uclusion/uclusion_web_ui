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
import { getFullStage, getStageNameForId } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { useHistory } from 'react-router'
import { formCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { resolveComment, updateComment } from '../../../api/comments'
import { QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import { getFormerStageId, isSingleAssisted } from '../../../utils/commentFunctions';
import { useIntl } from 'react-intl';


function DecideAssistanceStep(props) {
  const { marketId, commentId } = props;
  const intl = useIntl();
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
  const inv = getInvestible(investibleState, commentRoot.investible_id) || {};
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage, former_stage_id: formerStageId, assigned } = marketInfo;
  const fullStage = getFullStage(marketStagesState, marketId, stage);
  const nextStageId = getFormerStageId(formerStageId, marketId, marketStagesState);
  const nextStageName = getStageNameForId(marketStagesState, marketId, nextStageId, intl);
  const isSingle = isSingleAssisted(comments, assigned);
  const isSuggest = commentRoot.comment_type === SUGGEST_CHANGE_TYPE;


  function myOnFinish() {
    navigate(history, formCommentLink(marketId, commentRoot.group_id, commentRoot.investible_id, commentRoot.id));
  }

  function accept() {
    return updateComment(marketId, commentId, undefined, TODO_TYPE).then((comment) => {
      addCommentToMarket(comment, commentsState, commentsDispatch);
      setOperationRunning(false);
    })
  }

  function resolve() {
    return resolveComment(marketId, commentId)
      .then((comment) => {
        addCommentToMarket(comment, commentsState, commentsDispatch);
        setOperationRunning(false);
      });
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        Done with this
        {commentRoot.comment_type === QUESTION_TYPE ? ' question' : (isSuggest ? ' suggestion' : ' blocking issue')}?
      </Typography>
      {isSingle && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Resolving moves this job to {nextStageName}.
        </Typography>
      )}
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
        finish={myOnFinish}
        nextLabel={isSuggest ? 'wizardAcceptLabel' : 'commentResolveLabel'}
        onNext={() => {
          if (isSuggest) {
            return accept();
          }
          resolve();
        }}
        showOtherNext={isSuggest}
        otherNextLabel="saveReject"
        onOtherNext={resolve}
      />
    </div>
    </WizardStepContainer>
  );
}

DecideAssistanceStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideAssistanceStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideAssistanceStep;