import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { useHistory } from 'react-router'
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import JobDescription from '../JobDescription'
import { stageChangeInvestible } from '../../../api/investibles';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import {
  getAcceptedStage,
  getInCurrentVotingStage,
  getInReviewStage, getVerifiedStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { useIntl } from 'react-intl';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';


function DecideStageStep(props) {
  const { marketId, investibleId } = props;
  const intl = useIntl();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [investiblesState, invDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext)
  const history = useHistory();
  const classes = wizardStyles();
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage: currentStageId } = marketInfo || {};
  const acceptedStage = getAcceptedStage(marketStagesState, marketId) || {};
  const inReviewStage = getInReviewStage(marketStagesState, marketId) || {};
  const inVotingStage = getInCurrentVotingStage(marketStagesState, marketId) || {};
  const verifiedStage = getVerifiedStage(marketStagesState, marketId) || {};
  let destinationStage;
  let destinationExplanation;
  let destinationLabel;
  if (currentStageId === inVotingStage.id) {
    destinationStage = acceptedStage;
    destinationExplanation = 'planningInvestibleAcceptedExplanation';
    destinationLabel = 'planningInvestibleNextStageAcceptedLabel';
  } else if (currentStageId === acceptedStage.id) {
    destinationStage = inReviewStage;
    destinationLabel = 'planningInvestibleNextStageInReviewLabel';
    destinationExplanation = 'planningInvestibleInReviewExplanation';
  } else if (currentStageId === inReviewStage.id) {
    destinationStage = verifiedStage;
    destinationLabel = 'planningInvestibleMoveToVerifiedLabel';
    destinationExplanation = 'planningInvestibleVerifiedExplanation';
  }

  function moveToTarget() {
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: currentStageId,
        stage_id: destinationStage.id,
      },
    };
    return stageChangeInvestible(moveInfo)
      .then((newInv) => {
        onInvestibleStageChange(destinationStage.id, newInv, investibleId, marketId, commentsState, commentsDispatch,
          invDispatch, () => {}, marketStagesState, undefined, destinationStage);
        setOperationRunning(false);
      });
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        Is this job ready to move to {intl.formatMessage({ id: destinationLabel })}?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        {intl.formatMessage({ id: destinationExplanation })}.
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} />
      <WizardStepButtons
        {...props}
        nextLabel="DecideStageMove"
        onNext={moveToTarget}
        showOtherNext
        onOtherNext={() => navigate(history, formInvestibleLink(marketId, investibleId))}
        otherNextLabel="DecideWizardContinue"
      />
    </div>
    </WizardStepContainer>
  );
}

DecideStageStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideStageStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideStageStep;