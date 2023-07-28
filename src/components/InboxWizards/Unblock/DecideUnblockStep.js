import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { getCommentRoot } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInfo } from '../../../utils/userFunctions';
import { getFullStage, getFurtherWorkStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
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
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { getLabelForTerminate, getShowTerminate } from '../../../utils/messageUtils';

function DecideUnblockStep(props) {
  const { marketId, commentId, clearFormData, message } = props;
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
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const inv = commentRoot.investible_id ? getInvestible(investibleState, commentRoot.investible_id) : undefined;
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage } = marketInfo;

  function myTerminate() {
    removeWorkListItem(message, messagesDispatch, history);
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
        investiblesDispatch, () => {}, marketStagesState, undefined, fullStage,
        marketPresencesDispatch);
      clearFormData();
      setOperationRunning(false);
      dismissWorkListItem(message, messagesDispatch, history);
      navigate(history, formInvestibleLink(marketId, investibleId));
    });
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'DecideUnblockTitle'})}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Take action here or click the issue to resolve or move it.
      </Typography>
      <JobDescription marketId={marketId} investibleId={commentRoot.investible_id} comments={comments} removeActions />
      <WizardStepButtons
        {...props}
        nextLabel='UnblockReplyLabel'
        spinOnClick={false}
        showOtherNext
        otherNextLabel='DecideMoveToBacklog'
        onOtherNext={moveToBacklog}
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

DecideUnblockStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideUnblockStep;