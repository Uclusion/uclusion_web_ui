import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInfo } from '../../../utils/userFunctions';
import { formCommentLink } from '../../../utils/marketIdPathFunctions';
import CommentAdd from '../../Comments/CommentAdd';
import { getPageReducerPage, usePageStateReducer } from '../../PageState/pageStateHooks';

function ProgressReportStep(props) {
  const { marketId, investibleId, formData, onFinish } = props;
  const classes = wizardStyles();
  const [investiblesState] = useContext(InvestiblesContext);
  const [commentAddStateFull, commentAddDispatch] = usePageStateReducer('commentAddProgress');
  const [commentAddState, updateCommentAddState, commentAddStateReset] =
    getPageReducerPage(commentAddStateFull, commentAddDispatch, investibleId || marketId);
  const inv = getInvestible(investiblesState, investibleId);
  const { investible: myInvestible } = inv || {};
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { group_id: groupId } = marketInfo;
  const { commentType } = formData;

  function onSave(comment) {
    const link = formCommentLink(marketId, groupId, investibleId, comment.id);
    onFinish({ link });
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText} style={{marginBottom: 'unset'}}>
        What is your progress?
      </Typography>
      <CommentAdd
        nameKey="CommentAddProgress"
        type={commentType}
        wizardProps={props}
        commentAddState={commentAddState}
        updateCommentAddState={updateCommentAddState}
        commentAddStateReset={commentAddStateReset}
        issueWarningId='issueWarningPlanning'
        marketId={marketId}
        groupId={groupId}
        investible={myInvestible}
        onSave={onSave}
        nameDifferentiator="actionProgress"
        isStory
      />
    </div>
    </WizardStepContainer>
  );
}

ProgressReportStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

ProgressReportStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default ProgressReportStep;