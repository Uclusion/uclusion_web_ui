import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { formCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { REPORT_TYPE } from '../../../constants/comments';
import { useHistory } from 'react-router';
import CommentAdd from '../../Comments/CommentAdd';
import { getPageReducerPage, usePageStateReducer } from '../../PageState/pageStateHooks';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInfo } from '../../../utils/userFunctions';
import { getInReviewStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';

function StartReviewStep(props) {
  const { marketId, investibleId, groupId } = props;
  const [investibleState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentAddStateFull, commentAddDispatch] = usePageStateReducer('commentAddStartReview');
  const [commentAddState, updateCommentAddState, commentAddStateReset] =
    getPageReducerPage(commentAddStateFull, commentAddDispatch, investibleId || marketId);
  const classes = useContext(WizardStylesContext);
  const history = useHistory();
  const inv = getInvestible(investibleState, investibleId) || {};
  const info = getMarketInfo(inv, marketId);
  const { stage: currentStageId } = info || {};
  const inReviewStage = getInReviewStage(marketStagesState, marketId) || {id: 'fake'};

  if (currentStageId !== inReviewStage.id) {
    // Give quick add time to work
    return React.Fragment;
  }

  function onSave(comment) {
    navigate(history, formCommentLink(marketId, groupId, investibleId, comment.id));
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText} style={{marginBottom: 'unset'}}>
        What do you want reviewed?
      </Typography>
      <CommentAdd
        nameKey="CommentAddStartReview"
        type={REPORT_TYPE}
        wizardProps={props}
        commentAddState={commentAddState}
        updateCommentAddState={updateCommentAddState}
        commentAddStateReset={commentAddStateReset}
        marketId={marketId}
        groupId={groupId}
        fromInvestibleId={investibleId}
        onSave={onSave}
        nameDifferentiator="startReview"
      />
    </div>
    </WizardStepContainer>
  );
}

StartReviewStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

StartReviewStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default StartReviewStep;