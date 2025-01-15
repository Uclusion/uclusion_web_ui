import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import AddCommentStep from './AddCommentStep';
import { ISSUE_TYPE, QUESTION_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments';
import AddOptionStep from './AddOptionStep';
import ConfigureCommentStep from '../ConfigureCommentStep';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import CommentEdit from '../../Comments/CommentEdit';
import { getPageReducerPage, usePageStateReducer } from '../../PageState/pageStateHooks';
import { usePresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getInCurrentVotingStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import _ from 'lodash';
import DoneWithApprovalStep from './DoneWithApprovalStep';
import ChooseCommentTypeStep from './ChooseCommentTypeStep';

function JobCommentWizard(props) {
  const { investibleId, marketId, commentType, resolveId, typeObjectId } = props;
  const [commentsState] = useContext(CommentsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [wasMovedToApproval, setWasMovedToApproval] = useState(false);
  const [wasJustCreated, setWasJustCreated] = useState(false);
  const [useCommentType, setUseCommentType] = useState(commentType);
  const presences = usePresences(marketId);
  const isQuestion = useCommentType === QUESTION_TYPE;
  const isReport = useCommentType === REPORT_TYPE;
  const investibleComments = (commentsState[marketId]||[]).filter(comment =>
    comment.investible_id === investibleId) || [];
  const myPresence = presences.find((presence) => presence.current_user) || {};
  const savedDraft = investibleComments.find((comment) => {
    return comment.comment_type === useCommentType && !comment.resolved && !comment.deleted &&
      !comment.is_sent && comment.created_by === myPresence?.id;
  });
  const hasDraft = !_.isEmpty(savedDraft);
  const draftData = {inlineMarketId: savedDraft?.inline_market_id, commentId: savedDraft?.id, groupId:
    savedDraft?.group_id, marketId, investibleId, useCompression: true };
  const [editStateFull, editDispatch] = usePageStateReducer('commentEdit');
  const [editState, updateEditState, editStateReset] = getPageReducerPage(editStateFull, editDispatch, savedDraft?.id);
  const inv = getInvestible(investibleState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage, group_id: groupId, assigned } = marketInfo;
  const assignedStage = getInCurrentVotingStage(marketStagesState, marketId);

  if (!stage || _.isEmpty(assignedStage)) {
    return React.Fragment;
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`job_comment_wizard${investibleId}`} useLocalStorage={false}
                      defaultFormData={hasDraft ? draftData : {useCompression: true}}>
        {_.isEmpty(commentType) && (
          <ChooseCommentTypeStep investibleId={investibleId} marketId={marketId} useType={useCommentType}
                                 setUseCommentType={setUseCommentType} typeObjectId={typeObjectId} />
        )}
        {((isReport && assignedStage.id === stage)||wasMovedToApproval) && (
          <DoneWithApprovalStep investibleId={investibleId} marketId={marketId} currentStageId={stage}
                                onFinishMove={() => setWasMovedToApproval(true)} />
        )}
        {(!hasDraft || wasJustCreated) && (
          <AddCommentStep investibleId={investibleId} marketId={marketId} useType={useCommentType} resolveId={resolveId}
                          onFinishCreation={() => setWasJustCreated(true)}
                          currentStageId={stage} groupId={groupId} assigned={assigned} />
        )}
        {hasDraft && !wasJustCreated && (
          <CommentEdit
            marketId={marketId}
            comment={savedDraft}
            editState={editState}
            updateEditState={updateEditState}
            editStateReset={editStateReset}
            isWizard
          />
        )}
        {isQuestion && (
          <AddOptionStep investibleId={investibleId} marketId={marketId} />
        )}
        {[QUESTION_TYPE, SUGGEST_CHANGE_TYPE, ISSUE_TYPE].includes(useCommentType) && (
          <ConfigureCommentStep useType={useCommentType} />
        )}
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

JobCommentWizard.propTypes = {
  investibleId: PropTypes.string.isRequired
};
export default JobCommentWizard;

