import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { useIntl } from 'react-intl';
import { formCommentLink, formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import CommentAdd from '../../Comments/CommentAdd';
import { useHistory } from 'react-router';
import { getPageReducerPage, usePageStateReducer } from '../../PageState/pageStateHooks';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import {
  getBlockedStage,
  getRequiredInputStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';

function AddCommentStep (props) {
  const { investibleId, marketId, useType, updateFormData } = props;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const inv = getInvestible(investibleState, investibleId) || {};
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { group_id: groupId, stage: currentStageId } = marketInfo;
  const requiresInputStage = getRequiredInputStage(marketStagesState, marketId) || {};
  const blockingStage = getBlockedStage(marketStagesState, marketId) || {};
  const history = useHistory();
  const [commentAddStateFull, commentAddDispatch] = usePageStateReducer('addDecisionCommentWizard');
  const [commentAddState, updateCommentAddState, commentAddStateReset] =
    getPageReducerPage(commentAddStateFull, commentAddDispatch, investibleId);
  const isAssistance = [ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE].includes(useType);
  const inAssistanceStage = [requiresInputStage.id, blockingStage.id].includes(currentStageId);

  function onSave(comment) {
    if (comment.is_sent) {
      navigate(history, formCommentLink(marketId, groupId, investibleId, comment.id));
    } else {
      updateFormData({inlineMarketId: comment.inline_market_id, commentId: comment.id, marketId, investibleId,
        groupId});
    }
  }
  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
    <div>
      <Typography className={classes.introText}>
        What is your {intl.formatMessage({ id: `${useType.toLowerCase()}Simple` })}?
      </Typography>
      {isAssistance && !inAssistanceStage && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Opening this {intl.formatMessage({ id: `${useType.toLowerCase()}Simple` })} moves the job to
          Assistance stage.
        </Typography>
      )}
      {useType === TODO_TYPE && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Opening a task prevents moving this job to Verified stage until resolved.
        </Typography>
      )}
      <CommentAdd
        nameKey="JobCommentAdd"
        type={useType}
        wizardProps={{...props, isAddWizard: true,
          terminateLabel: 'JobWizardBacktoJob',
          onTerminate: () => navigate(history, formInvestibleLink(marketId, investibleId)),
          showTerminate: true}}
        commentAddState={commentAddState}
        updateCommentAddState={updateCommentAddState}
        commentAddStateReset={commentAddStateReset}
        marketId={marketId}
        groupId={groupId}
        fromInvestibleId={investibleId}
        onSave={onSave}
        nameDifferentiator="jobComment"
      />
    </div>
    </WizardStepContainer>
  );
}

AddCommentStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

AddCommentStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default AddCommentStep;