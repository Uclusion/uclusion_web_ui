import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext'
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox'
import { formCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { REPORT_TYPE } from '../../../constants/comments';
import { stageChangeInvestible } from '../../../api/investibles';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { useHistory } from 'react-router';
import { getInReviewStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';

function StartReviewStep(props) {
  const { marketId, investibleId, inv, groupId, currentStageId } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const classes = wizardStyles();
  const history = useHistory();
  const { investible: myInvestible } = inv || {};
  const destinationStage = getInReviewStage(marketStagesState, marketId) || {};

  function onSave(comment) {
    const link = formCommentLink(marketId, groupId, investibleId, comment.id);
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: currentStageId,
        stage_id: destinationStage.id,
      },
    };
    setOperationRunning(true);
    return stageChangeInvestible(moveInfo).then((newInv) => {
      onInvestibleStageChange(destinationStage.id, newInv, investibleId, marketId, commentsState, commentsDispatch,
        invDispatch, () => {}, marketStagesState, undefined, destinationStage);
      setOperationRunning(false);
      navigate(history, link);
    });
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText} style={{marginBottom: 'unset'}}>
        What do you want reviewed?
      </Typography>
      <CommentAddBox
        allowedTypes={[REPORT_TYPE]}
        investible={myInvestible}
        marketId={marketId}
        groupId={groupId}
        issueWarningId={'issueWarningPlanning'}
        isInReview={false}
        isStory
        wizardProps={props}
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