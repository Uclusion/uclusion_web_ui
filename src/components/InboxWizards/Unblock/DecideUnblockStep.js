import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import {
  getComment,
  getCommentRoot,
  getMarketComments,
  isDesignCapsule
} from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInfo } from '../../../utils/userFunctions';
import {
  getAcceptedStage,
  getFullStage,
  getFurtherWorkStage,
  getInCurrentVotingStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { dismissWorkListItem, removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { stageChangeInvestible } from '../../../api/investibles';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { useIntl } from 'react-intl';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import JobDescription from '../JobDescription';
import { useHistory } from 'react-router';
import { formInvestibleLink, formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';
import { getLabelForTerminate, getShowTerminate } from '../../../utils/messageUtils';
import { REPLY_WIZARD_TYPE } from '../../../constants/markets';
import { hasReply } from '../../AddNewWizards/Reply/ReplyStep';

function DecideUnblockStep(props) {
  const { marketId, commentId, message, formData = {}, updateFormData = () => {} } = props;
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [,marketPresencesDispatch] = useContext(MarketPresencesContext);
  const intl = useIntl();
  const history = useHistory();
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const comments = getMarketComments(commentState, marketId).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const inv = commentRoot.investible_id ? getInvestible(investibleState, commentRoot.investible_id) : undefined;
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage } = marketInfo;
  const currentStage = getFullStage(marketStagesState, marketId, stage) || {};
  const doableStage = getAcceptedStage(marketStagesState, marketId);
  const approvableStage = getInCurrentVotingStage(marketStagesState, marketId);
  const isCapsule = isDesignCapsule(commentRoot);
  const isDoable = stage && stage === doableStage?.id;
  const isApprovable = stage && stage === approvableStage?.id;
  const implementationTargetStage = isCapsule && (isDoable || isApprovable) ?
    (isDoable ? approvableStage : doableStage) : undefined;
  const { useCompression } = formData;

  function myTerminate() {
    removeWorkListItem(message, messagesDispatch, history);
  }

  function changeStage(targetStage) {
    const investibleId = commentRoot.investible_id;
    const targetStageId = targetStage.id;
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: stage,
        stage_id: targetStageId,
      },
    };
    return stageChangeInvestible(moveInfo).then((investible) => {
      onInvestibleStageChange(targetStageId, investible, investibleId, marketId, commentState, commentDispatch,
        investiblesDispatch, () => {}, marketStagesState, undefined, currentStage,
        marketPresencesDispatch);
      setOperationRunning(false);
    });
  }

  function moveToBacklog() {
    return changeStage(getFurtherWorkStage(marketStagesState, marketId)).then(() => {
      const investibleId = commentRoot.investible_id;
      dismissWorkListItem(message, messagesDispatch);
      navigate(history, formInvestibleLink(marketId, investibleId));
    });
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({ id: isCapsule ? 'ReviewDesignTitle' : 'DecideUnblockTitle' })}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        {isCapsule ? intl.formatMessage({ id: 'ReviewDesignStage' }, { stage: currentStage.name }) :
          'Choosing reply also gives you the option to resolve.'}
      </Typography>
      <JobDescription marketId={marketId} investibleId={commentRoot.investible_id} comments={comments}
                      useCompression={useCompression} inboxMessageId={commentId}
                      toggleCompression={() => updateFormData({ useCompression: !useCompression })}
                      removeActions/>
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        focus
        nextLabel="UnblockReplyLabel"
        onNext={() => navigate(history, formWizardLink(REPLY_WIZARD_TYPE, marketId,
          undefined, undefined, commentId, message.type_object_id))}
        nextShowEdit={hasReply(getComment(commentState, marketId, commentId))}
        spinOnClick={false}
        showOtherNext={!isCapsule || !!implementationTargetStage}
        otherNextLabel={isCapsule ? (isDoable ? 'pauseImplementation' : 'startImplementation') :
          'DecideMoveToBacklog'}
        onOtherNext={isCapsule ? () => changeStage(implementationTargetStage) : moveToBacklog}
        onOtherNextDoAdvance={!isCapsule}
        isOtherFinal
        onFinish={myTerminate}
        showTerminate={getShowTerminate(message)}
        terminateLabel={getLabelForTerminate(message)}
      />
    </WizardStepContainer>
  );
}

DecideUnblockStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default DecideUnblockStep;
