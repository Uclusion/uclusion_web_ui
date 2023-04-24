import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import JobStageStep from './JobStageStep';
import JobAssignStep from './JobAssignStep';
import CloseCommentsStep from './CloseCommentsStep';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import _ from 'lodash';
import {
  isInReviewStage,
  isNotDoingStage,
  isVerifiedStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { formInvestibleLink, formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { getMarketPresences, getReasonForVote } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import StageActionStep from './StageActionStep';
import { editorEmpty } from '../../TextEditors/Utilities/CoreUtils';

function JobStageWizard(props) {
  const { marketId, investibleId } = props;
  const history = useHistory();
  const [investibleState] = useContext(InvestiblesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [commentsState] = useContext(CommentsContext);
  const inv = getInvestible(investibleState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage, assigned, group_id: groupId } = marketInfo;
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const yourPresence = marketPresences.find((presence) => presence.current_user);
  const yourVote = yourPresence?.investments?.find((investment) =>
    investment.investible_id === investibleId);
  const marketComments = getMarketComments(commentsState, marketId, groupId);
  const yourReason = getReasonForVote(yourVote, marketComments);

  if (_.isEmpty(stage)) {
    return React.Fragment;
  }

  function requiresAction(fullMoveStage) {
    if (!_.isEmpty(fullMoveStage)) {
      if (isInReviewStage(fullMoveStage)) {
        return true;
      }
      if (fullMoveStage.allows_investment) {
        if (!yourVote || yourVote.deleted) {
          return true;
        }
      }
    }
    return false
  }

  function finish(fullMoveStage, isTerminate=false) {
    if (isTerminate || !requiresAction((fullMoveStage))) {
      if (fullMoveStage && (isNotDoingStage(fullMoveStage) || isVerifiedStage(fullMoveStage))) {
        navigate(history, formMarketLink(marketId, groupId));
      } else {
        navigate(history, formInvestibleLink(marketId, investibleId));
      }
    }
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`job_stage_wizard${investibleId}`} useLocalStorage={false}>
        <JobStageStep myFinish={finish} marketId={marketId} investibleId={investibleId} marketInfo={marketInfo}
                      requiresAction={requiresAction} />
        <JobAssignStep myFinish={finish} marketId={marketId} investibleId={investibleId} marketInfo={marketInfo} />
        <CloseCommentsStep myFinish={finish} marketId={marketId} investibleId={investibleId} marketInfo={marketInfo} />
        <StageActionStep myFinish={finish} marketId={marketId} investibleId={investibleId} marketInfo={marketInfo}
                         currentReasonId={yourReason?.id} groupId={groupId} wasDeleted={yourVote?.deleted}
                         originalReason={!editorEmpty(yourReason?.body) ? yourReason?.body : undefined}
                         originalQuantity={yourVote ? yourVote.quantity : 0} userId={yourPresence?.id}/>
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

JobStageWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

JobStageWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default JobStageWizard;

