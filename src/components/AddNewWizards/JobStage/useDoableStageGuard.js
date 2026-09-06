import { useContext } from 'react';
import { useHistory } from 'react-router';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { getInvestibleComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getFullStage, isAcceptedStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { getUnresolvedAIQuestions } from '../../../utils/commentFunctions';
import { formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';
import { JOB_STAGE_WIZARD_TYPE } from '../../../constants/markets';

export default function useDoableStageGuard(marketId) {
  const [commentsState] = useContext(CommentsContext);
  const [presencesState] = useContext(MarketPresencesContext);
  const [stagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const history = useHistory();

  return (investibleId, stageId, assignId) => {
    const targetStage = getFullStage(stagesState, marketId, stageId) || {};
    if (!isAcceptedStage(targetStage)) {
      return false;
    }
    const questions = getUnresolvedAIQuestions(
      getInvestibleComments(investibleId, marketId, commentsState), presencesState[marketId]);
    if (questions.length === 0) {
      return false;
    }
    const assignment = assignId ? `&assignId=${assignId}` : '';
    setOperationRunning(false);
    navigate(history, `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, investibleId)}&stageId=${stageId}${assignment}`);
    return true;
  };
}
