import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import _ from 'lodash'
import WizardStepContainer from '../WizardStepContainer'
import { WizardStylesContext } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons'
import AssignmentList from '../../../pages/Dialog/Planning/AssignmentList'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { addPlanningInvestible, stageChangeInvestible, updateInvestible } from '../../../api/investibles';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router'
import { getInvestible, refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { moveCommentsFromIds } from './DecideWhereStep';
import { useIntl } from 'react-intl';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { getCommentThreads } from '../../../contexts/CommentsContext/commentsContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import {
  getFullStage, getFurtherWorkStage,
  getInCurrentVotingStage,
  isFurtherWorkStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';

function JobAssignStep (props) {
  const { marketId, updateFormData, formData, onFinish, assigneeId, groupId, marketComments, fromCommentIds } = props;
  const history = useHistory();
  const value = formData.wasSet ? (formData.assigned || []) : (assigneeId ? [assigneeId] : []);
  const validForm = !_.isEmpty(value);
  const intl = useIntl();
  const [presencesState, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const presences = getMarketPresences(presencesState, marketId);
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const classes = useContext(WizardStylesContext);
  const { investibleId } = formData;
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage: stageId } = marketInfo;
  const fullCurrentStage = getFullStage(marketStagesState, marketId, stageId) || {};
  const roots = (fromCommentIds || []).map((fromCommentId) =>
    marketComments.find((comment) => comment.id === fromCommentId) || {id: 'notFound'});
  const comments = getCommentThreads(roots, marketComments);

  function onAssignmentChange(newAssignments){
    updateFormData({
      assigned: newAssignments,
      wasSet: true
    });
  }

  function createJob() {
    const name = intl.formatMessage({ id: 'jobFromBugs' });
    // Coming from existing comments usually ready to start - bugs are and voted questions or suggestion should be
    const addInfo = {
      name,
      groupId,
      marketId,
      assignments: value
    }
    return addPlanningInvestible(addInfo)
      .then((inv) => {
        refreshInvestibles(investiblesDispatch, () => {}, [inv]);
        const { id: investibleId } = inv.investible;
        let link = formInvestibleLink(marketId, investibleId);
        // update the form data with the saved investible
        updateFormData({
          investibleId,
          link,
        });
        return moveCommentsFromIds(inv, comments, fromCommentIds, marketId, groupId, messagesState, updateFormData,
          commentsDispatch, messagesDispatch);
      })
  }

  function assignJob() {
    if (validForm) {
      const isBacklogAlready = isFurtherWorkStage(fullCurrentStage);
      if ((_.isEmpty(value) && !isBacklogAlready) || (!_.isEmpty(value) && isBacklogAlready)) {
        // if assignments changing from none to some or vice versa need to use stageChangeInvestible instead
        const fullMoveStage = isBacklogAlready ? getInCurrentVotingStage(marketStagesState, marketId) :
          getFurtherWorkStage(marketStagesState, marketId);
        const moveInfo = {
          marketId,
          investibleId,
          stageInfo: {
            assignments: value,
            current_stage_id: stageId,
            stage_id: fullMoveStage.id,
          },
        };
        return stageChangeInvestible(moveInfo)
          .then((newInv) => {
            onInvestibleStageChange(fullMoveStage.id, newInv, investibleId, marketId, commentsState,
              commentsDispatch, investiblesDispatch, () => {}, marketStagesState, undefined,
              fullCurrentStage, marketPresencesDispatch);
            return formData;
          });
      } else {
        const updateInfo = {
          marketId,
          investibleId,
          assignments: value,
        };
        return updateInvestible(updateInfo).then((fullInvestible) => {
          refreshInvestibles(investiblesDispatch, () => {}, [fullInvestible]);
          return formData;
        });
      }
    }
    return Promise.resolve(true);
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
        <Typography className={classes.introText} variant="h6">
          Who should be working on the job?
        </Typography>
        <Typography className={classes.introSubText} variant="subtitle1">
          Not assigning sends to job backlog.
        </Typography>
        <AssignmentList
          fullMarketPresences={presences}
          previouslyAssigned={assigneeId ? [assigneeId] : undefined}
          onChange={onAssignmentChange}
        />
        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          finish={onFinish}
          validForm={validForm}
          showNext
          onNextSkipStep
          showTerminate
          onNext={investibleId ? assignJob : createJob}
          isFinal={false}
          showOtherNext
          otherNextLabel="addApproversLabel"
          onTerminate={() => navigate(history, formData.link)}
          terminateLabel="JobWizardGotoJob"
          nextLabel="JobWizardAssignJob"
        />
    </WizardStepContainer>
  )
}

JobAssignStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

JobAssignStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default JobAssignStep