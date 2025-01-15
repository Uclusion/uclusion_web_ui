import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import RemoveInProgressStep from './RemoveInProgressStep';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import _ from 'lodash';
import { usePresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { getNotDoingStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getComment, getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';

export function previousInProgress(userId, currentCommentId, investibleState, commentsState, marketId, groupId,
  notDoingStageId) {
  const marketComments = getMarketComments(commentsState, marketId, groupId);
  const inProgressComments = marketComments.filter((comment) => !comment.resolved && comment.in_progress &&
    comment.id !== currentCommentId);
  return inProgressComments.filter((comment) => {
    const inv = getInvestible(investibleState, comment.investible_id) || {};
    const marketInfo = getMarketInfo(inv, marketId) || {};
    const { stage, assigned} = marketInfo;
    if (!assigned?.includes(userId)) {
      return false;
    }
    return stage !== notDoingStageId;
  });
}

function TaskInProgressWizard(props) {
  const { marketId, commentId } = props;
  const [investibleState] = useContext(InvestiblesContext);
  const [commentsState] = useContext(CommentsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const presences = usePresences(marketId);
  const comment = getComment(commentsState, marketId, commentId);
  const myPresence = presences.find((presence) => presence.current_user);
  const notDoingStage = getNotDoingStage(marketStagesState, marketId)
  const otherInProgress = previousInProgress(myPresence?.id, commentId, investibleState, commentsState, marketId,
    comment?.group_id, notDoingStage?.id);

  if (_.isEmpty(otherInProgress)) {
    return React.Fragment;
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`task_in_progress_wizard${comment?.investible_id}`}
                      defaultFormData={{useCompression: true}} useLocalStorage={false}>
          <RemoveInProgressStep otherInProgress={otherInProgress} comment={comment} />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

TaskInProgressWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

TaskInProgressWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default TaskInProgressWizard;

