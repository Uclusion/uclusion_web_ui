import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox'
import {
  addCommentToMarket,
  getCommentRoot
} from '../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import {
  addInvestible,
  getInvestible
} from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketInfo } from '../../../utils/userFunctions'
import {
  getFullStage,
  getFurtherWorkStage,
  isRequiredInputStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { useHistory } from 'react-router'
import { wizardFinish } from '../InboxWizardUtils'
import { formCommentLink } from '../../../utils/marketIdPathFunctions'
import { removeWorkListItem, workListStyles } from '../../../pages/Home/YourWork/WorkListItem'
import { resolveComment } from '../../../api/comments'
import _ from 'lodash'
import { stageChangeInvestible } from '../../../api/investibles'
import { onInvestibleStageChange } from '../../../utils/investibleFunctions'

function DecideUnblockStep(props) {
  const { marketId, commentId, clearFormData, message } = props;
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const history = useHistory();
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = useContext(WizardStylesContext);
  const workItemClasses = workListStyles();
  const inv = commentRoot.investible_id ? getInvestible(investibleState, commentRoot.investible_id) : undefined;
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage, former_stage_id: formerStageId } = marketInfo;
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};

  function myTerminate() {
    wizardFinish({
        link: formCommentLink(marketId, commentRoot.group_id, commentRoot.investible_id,
          commentRoot.id)
      },
      setOperationRunning, message, history);
  }

  function moveToBacklog() {
    const investibleId = commentRoot.investible_id;
    const targetStageId = getFurtherWorkStage(marketStagesState, marketId).id;
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: stage,
        stage_id: targetStageId,
      },
    };
    return stageChangeInvestible(moveInfo).then((investible) => {
      const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
      onInvestibleStageChange(targetStageId, investible, investibleId, marketId, commentState, commentDispatch,
        investiblesDispatch, () => {}, marketStagesState, undefined, fullStage);
      clearFormData();
      setOperationRunning(false);
      removeWorkListItem(message, workItemClasses.removed);
    });
  }

  function resolve() {
    return resolveComment(marketId, commentId)
      .then((comment) => {
        addCommentToMarket(comment, commentState, commentDispatch);
        if (formerStageId && fullStage && isRequiredInputStage(fullStage)) {
          const newInfo = {
            ...marketInfo,
            stage: formerStageId,
            last_stage_change_date: comment.updated_at,
          };
          const newInfos = _.unionBy([newInfo], inv.market_infos, 'id');
          const newInvestible = {
            investible: inv.investible,
            market_infos: newInfos
          };
          addInvestible(investiblesDispatch, () => {}, newInvestible);
        }
        clearFormData();
        setOperationRunning(false);
        removeWorkListItem(message, workItemClasses.removed);
      });
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        How will you help unblock?
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
          showVoting
        />
      </div>
      <WizardStepButtons
        {...props}
        nextLabel='commentResolveLabel'
        onNext={resolve}
        showOtherNext
        otherNextLabel='DecideMoveToBacklog'
        onOtherNext={moveToBacklog}
        showTerminate={true}
        onFinish={myTerminate}
        terminateLabel='DecideWizardContinue'
      />
    </div>
    </WizardStepContainer>
  );
}

DecideUnblockStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideUnblockStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideUnblockStep;