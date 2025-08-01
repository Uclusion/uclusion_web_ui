import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import JobAssignStep from './JobAssignStep';
import CloseCommentsStep from './CloseCommentsStep';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import _ from 'lodash';
import {
  getInCurrentVotingStage,
  isAcceptedStage, isFurtherWorkStage,
  isInReviewStage,
  isNotDoingStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { formInvestibleLink, formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import {
  getMarketPresences,
  getReasonForVote,
  useGroupPresences
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import StageActionStep from './StageActionStep';
import { editorEmpty } from '../../TextEditors/Utilities/CoreUtils';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';

export function requiresAction(fullMoveStage, isSingleUser, isBlocked, yourVote) {
  if (!_.isEmpty(fullMoveStage)&&!isNotDoingStage(fullMoveStage)) {
    // Not prompting for review if single user
    if (fullMoveStage.close_comments_on_entrance && !isSingleUser) {
      return true;
    }
    // Not prompting for certainty if single user
    if (fullMoveStage.allows_investment && !isSingleUser) {
      if (!yourVote || yourVote.deleted) {
        return true;
      }
    }
    if (isFurtherWorkStage(fullMoveStage)&&!isBlocked) {
      return true;
    }
  }
  return false
}

function JobStageWizard(props) {
  const { marketId, investibleId, stageId, isAssign, isBlocked, assignId } = props;
  const history = useHistory();
  const [investibleState] = useContext(InvestiblesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [commentsState] = useContext(CommentsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const inv = getInvestible(investibleState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage, group_id: groupId, assigned } = marketInfo;
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const yourPresence = marketPresences.find((presence) => presence.current_user);
  const yourVote = yourPresence?.investments?.find((investment) =>
    investment.investible_id === investibleId);
  const marketComments = getMarketComments(commentsState, marketId, groupId);
  const yourReason = getReasonForVote(yourVote, marketComments);
  const isSingleUser = useGroupPresences(groupId, marketId, marketPresences);
  const useStageId = stageId ? stageId :
    (isAssign === 'true' ? getInCurrentVotingStage(marketStagesState, marketId)?.id : undefined);

  if (_.isEmpty(stage)) {
    return React.Fragment;
  }

  function myRequiresAction(fullMoveStage) {
    return requiresAction(fullMoveStage, isSingleUser, isBlocked);
  }

  function finish(fullMoveStage, isTerminate=false) {
    if (isTerminate || !myRequiresAction(fullMoveStage)) {
      if (!isTerminate && fullMoveStage && (isNotDoingStage(fullMoveStage) || isInReviewStage(fullMoveStage))) {
        navigate(history, formMarketLink(marketId, groupId));
      } else {
        if (fullMoveStage && isAcceptedStage(fullMoveStage)) {
          navigate(history, `${formInvestibleLink(marketId, investibleId)}#start`);
        } else {
          navigate(history, formInvestibleLink(marketId, investibleId));
        }
      }
    }
  }
  const approveQuantity = yourVote ? yourVote.quantity : 0;
  const originalReason = !editorEmpty(yourReason?.body) ? yourReason?.body : undefined;
  return (
    <WizardStylesProvider>
      <FormdataWizard name={`job_stage_wizard${investibleId}`} useLocalStorage={false}
                      defaultFormData={{approveQuantity: Math.abs(approveQuantity), originalQuantity: approveQuantity,
                        wasDeleted: yourVote?.deleted, userId: yourPresence?.id, approveReason: originalReason,
                        originalReason, stage: useStageId ? useStageId : undefined, stageWasSet: !!useStageId,
                        useCompression: true, originalAssigned: assigned}}>
        {isAssign === 'true' && (
          <JobAssignStep myFinish={finish} marketId={marketId} investibleId={investibleId} marketInfo={marketInfo}
                         requiresAction={myRequiresAction} />
        )}
        {isAssign !== 'false' && (
          <CloseCommentsStep myFinish={finish} marketId={marketId} investibleId={investibleId} marketInfo={marketInfo}
                             isAssign={isAssign} requiresAction={myRequiresAction} isSingleUser={isSingleUser}
                             assignId={assignId}/>
        )}
        <StageActionStep myFinish={finish} marketId={marketId} investibleId={investibleId} marketInfo={marketInfo}
                         currentReasonId={yourReason?.id} groupId={groupId} />
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

