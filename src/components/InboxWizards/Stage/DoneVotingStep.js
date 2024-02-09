import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { useHistory } from 'react-router';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import JobDescription from '../JobDescription';
import { stageChangeInvestible } from '../../../api/investibles';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getAcceptedStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { useIntl } from 'react-intl';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { JUSTIFY_TYPE } from '../../../constants/comments';
import Voting from '../../../pages/Investible/Decision/Voting';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import Link from '@material-ui/core/Link';
import { pokeInvestible } from '../../../api/users';

function DoneVotingStep(props) {
  const { marketId, investibleId, groupId, currentStageId, formData, updateFormData } = props;
  const intl = useIntl();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [marketPresencesState,marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [marketsState] = useContext(MarketsContext);
  const history = useHistory();
  const classes = wizardStyles();
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const marketComments = getMarketComments(commentsState, marketId, groupId);
  const market = getMarket(marketsState, marketId) || {};
  const investmentReasons = marketComments.filter((comment) => {
    return comment.comment_type === JUSTIFY_TYPE && comment.investible_id === investibleId;
  });
  const { useCompression } = formData;

  function moveToStage() {
    const acceptedStage = getAcceptedStage(marketStagesState, marketId) || {};
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: currentStageId,
        stage_id: acceptedStage.id,
      },
    };
    return stageChangeInvestible(moveInfo)
      .then((newInv) => {
        onInvestibleStageChange(acceptedStage.id, newInv, investibleId, marketId, commentsState, commentsDispatch,
          invDispatch, () => {}, marketStagesState, undefined, acceptedStage,
          marketPresencesDispatch);
        setOperationRunning(false);
        navigate(history, `${formInvestibleLink(marketId, investibleId)}#start`);
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
        Approval expiration is set to {market.investment_expiration} days. Poke to resend notifications and
        message <Link href="https://documentation.uclusion.com/notifications" target="_blank">configured channels</Link>.
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} removeActions/>
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
        toggleCompression={() => updateFormData({ useCompression: !useCompression })}
        useCompression={useCompression}
      />
      <div className={classes.marginBottom}/>
      <WizardStepButtons
        {...props}
        nextLabel="startJob"
        onNext={() => moveToStage()}
        showOtherNext
        otherSpinOnClick={false}
        otherNextLabel="RejectAssignment"
        isOtherFinal={false}
        showTerminate
        terminateLabel="poke"
        terminateSpinOnClick
        onFinish={() => pokeInvestible(marketId, investibleId).then(() => {
          setOperationRunning(false);
        })}
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