import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import StepButtons from './StepButtons';
import { createPlanning } from '../../api/markets';
import { addMarketToStorage } from '../../contexts/MarketsContext/marketsContextHelper';
import { processTextAndFilesForSave } from '../../api/files';
import { addPlanningInvestible, stageChangeInvestible } from '../../api/investibles';
import { DiffContext } from '../../contexts/DiffContext/DiffContext';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { addInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { formInviteLink, formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { addPresenceToMarket } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { saveComment } from '../../api/comments';
import { REPORT_TYPE } from '../../constants/comments';
import { addCommentToMarket } from '../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { VersionsContext } from '../../contexts/VersionsContext/VersionsContext';

function CreatingWorkspaceStep (props) {
  const { formData, active } = props;
  const [, diffDispatch] = useContext(DiffContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [, versionsDispatch] = useContext(VersionsContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);

  const [workspaceInfo, setWorkspaceInfo] = useState({});
  const history = useHistory();

  useEffect(() => {

    const { workspaceCreated } = workspaceInfo;
    if (!workspaceCreated && active) {
      const { meetingName } = formData;
      const marketInfo = {
        name: meetingName,
      };
      let marketId;
      let investibleId;
      let inProgressStage;
      let inVotingStage;
      let myUserId;
      createPlanning(marketInfo)
        .then((marketDetails) => {
          const {
            market,
            presence,
            stages
          } = marketDetails;
          marketId = market.id;
          myUserId = presence.id;
          addMarketToStorage(marketsDispatch, diffDispatch, market);
          addPresenceToMarket(presenceDispatch, marketId, presence);
          inVotingStage = stages.find((stage) => stage.allows_investment);
          inProgressStage = stages.find((stage) => stage.singular_only);
          const {
            currentStoryUploadedFiles,
            currentStoryName,
            currentStoryDescription,
            currentStoryEstimate,
            currentStoryProgressSkipped,
          } = formData;
          const realUploadedFiles = currentStoryUploadedFiles || [];
          const processed = processTextAndFilesForSave(realUploadedFiles, currentStoryDescription);
          const addInfo = {
            marketId,
            name: currentStoryName,
            description: processed.text,
            uploadedFiles: processed.uploadedFiles,
            assignments: [myUserId],
          };
          if (!_.isEmpty(currentStoryEstimate) && !currentStoryProgressSkipped) {
            addInfo.daysEstimate = currentStoryEstimate;
          }
          return addPlanningInvestible(addInfo);
        })
        .then((investible) => {
          addInvestible(investiblesDispatch, diffDispatch, investible);
          investibleId = investible.investible.id;
          const updateInfo = {
            marketId,
            investibleId,
            stageInfo: {
              current_stage_id: inVotingStage.id,
              stage_id: inProgressStage.id,
            }
          };
          return stageChangeInvestible(updateInfo);
        })
        .then(() => {
          const { currentStoryProgress, currentStoryProgressSkipped } = formData;
          if (!_.isEmpty(currentStoryProgress) && !currentStoryProgressSkipped) {
            return saveComment(marketId, investibleId, undefined, currentStoryProgress, REPORT_TYPE, []);
          } else {
            return Promise.resolve(false);
          }
        })
        .then((addedComment) => {
          if (addedComment) {
            addCommentToMarket(addedComment, commentsState, commentsDispatch, versionsDispatch);
          }
          const { nextStoryName, nextStoryDescription, nextStoryUploadedFiles, nextStorySkipped } = formData;
          if (!_.isEmpty(nextStoryName) && !nextStorySkipped) {
            const usedUploads = nextStoryUploadedFiles || [];
            const processed = processTextAndFilesForSave(usedUploads, nextStoryDescription);
            // add the story
            const addInfo = {
              marketId,
              name: nextStoryName,
              description: processed.text,
              uploadedFiles: processed.uploadedFiles,
              assignments: [myUserId],
            };
            return addPlanningInvestible(addInfo);
          }
          return Promise.resolve(false);
        })
        .then((addedStory) => {
          if (addedStory) {
            addInvestible(investiblesDispatch, diffDispatch, addedStory);
          }
          setWorkspaceInfo({ workspaceCreated: true, marketId });
        });
    }
  }, [
    workspaceInfo, active, commentsDispatch, commentsState,
    diffDispatch, versionsDispatch, formData, investiblesDispatch,
    marketsDispatch, presenceDispatch
  ]);
  const { marketId, workspaceCreated } = workspaceInfo;
  const inviteLink = formInviteLink(marketId);
  const marketLink = formMarketLink(marketId);

  if (!active) {
    return React.Fragment;
  }

  return (
    <div>
      {!workspaceCreated && (
        <div>
          We're creating your workspace now, please wait a moment.
        </div>

      )}
      {workspaceCreated && (
        <div>
          We've created your workspace, please share this link {inviteLink} with your team to invite them
          <StepButtons
            showGoBack={false}
            finishLabel={'OnboardingWizardTakeMeToWorkspace'}
            onNext={() => navigate(history, marketLink)}/>
        </div>
      )}
    </div>
  );
}

CreatingWorkspaceStep.propTypes = {
  formData: PropTypes.object,
  active: PropTypes.bool,
};

CreatingWorkspaceStep.defaultProps = {
  formData: {},
  active: false,
};



export default CreatingWorkspaceStep;