import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { useHistory } from 'react-router';
import { formInvestibleAddCommentLink, formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import JobDescription from '../JobDescription';
import { stageChangeInvestible } from '../../../api/investibles';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import {
  getAcceptedStage,
  getFurtherWorkStage,
  isAcceptedStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { useIntl } from 'react-intl';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { JOB_COMMENT_WIZARD_TYPE } from '../../../constants/markets';
import { JUSTIFY_TYPE, QUESTION_TYPE } from '../../../constants/comments';
import Voting from '../../../pages/Investible/Decision/Voting';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { getInboxTarget } from '../../../contexts/NotificationsContext/notificationsContextHelper';

function DoneVotingStep(props) {
  const { marketId, investibleId, groupId, currentStageId } = props;
  const intl = useIntl();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [marketPresencesState,marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [marketsState] = useContext(MarketsContext);
  const history = useHistory();
  const classes = wizardStyles();
  const acceptedStage = getAcceptedStage(marketStagesState, marketId) || {};
  const backlogStage = getFurtherWorkStage(marketStagesState, marketId)
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const marketComments = getMarketComments(commentsState, marketId, groupId);
  const market = getMarket(marketsState, marketId) || {};
  const investmentReasons = marketComments.filter((comment) => {
    return comment.comment_type === JUSTIFY_TYPE && comment.investible_id === investibleId;
  });

  function moveToStage(aStage, isGotoJob) {
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: currentStageId,
        stage_id: aStage.id,
      },
    };
    return stageChangeInvestible(moveInfo)
      .then((newInv) => {
        onInvestibleStageChange(aStage.id, newInv, investibleId, marketId, commentsState, commentsDispatch,
          invDispatch, () => {}, marketStagesState, undefined, aStage, marketPresencesDispatch);
        setOperationRunning(false);
        if (isGotoJob) {
          if (isAcceptedStage(aStage)) {
            navigate(history, `${formInvestibleLink(marketId, investibleId)}#start`);
          } else {
            navigate(history, formInvestibleLink(marketId, investibleId));
          }
        } else {
          navigate(history, getInboxTarget());
        }
      });
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({ id: 'finishApprovalQ' })}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        {intl.formatMessage({ id: 'planningInvestibleAcceptedExplanation' })}.
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} removeActions />
      <Voting
        investibleId={investibleId}
        marketPresences={marketPresences}
        investmentReasons={investmentReasons}
        showExpiration={true}
        expirationMinutes={market.investment_expiration * 1440}
        votingAllowed={false}
        yourPresence={marketPresences.find((presence) => presence.current_user)}
        market={market}
        isInbox
      />
      <WizardStepButtons
        {...props}
        nextLabel="startJob"
        onNext={() => moveToStage(acceptedStage, true)}
        showOtherNext
        onOtherNext={() => navigate(history,
            formInvestibleAddCommentLink(JOB_COMMENT_WIZARD_TYPE, investibleId, marketId, QUESTION_TYPE))
        }
        isOtherFinal={false}
        otherSpinOnClick={false}
        otherNextLabel="commentIconAskQuestionLabel"
        showTerminate
        terminateLabel="DecideMoveBacklog"
        terminateSpinOnClick
        onFinish={() => moveToStage(backlogStage, false)}
      />
    </WizardStepContainer>
  );
}

DoneVotingStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DoneVotingStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DoneVotingStep;