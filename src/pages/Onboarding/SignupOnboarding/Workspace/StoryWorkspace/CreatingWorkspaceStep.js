import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { createPlanning } from '../../../../../api/markets'
import { addMarketToStorage } from '../../../../../contexts/MarketsContext/marketsContextHelper'
import { processTextAndFilesForSave } from '../../../../../api/files'
import { addPlanningInvestible, stageChangeInvestible } from '../../../../../api/investibles'
import { DiffContext } from '../../../../../contexts/DiffContext/DiffContext'
import { InvestiblesContext } from '../../../../../contexts/InvestibesContext/InvestiblesContext'
import { MarketsContext } from '../../../../../contexts/MarketsContext/MarketsContext'
import { addInvestible } from '../../../../../contexts/InvestibesContext/investiblesContextHelper'
import { formMarketLink, formMarketManageLink, navigate } from '../../../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { addPresenceToMarket } from '../../../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { saveComment } from '../../../../../api/comments'
import { REPORT_TYPE } from '../../../../../constants/comments'
import { addCommentToMarket } from '../../../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../../../contexts/CommentsContext/CommentsContext'
import { VersionsContext } from '../../../../../contexts/VersionsContext/VersionsContext'
import { useIntl } from 'react-intl'
import { CircularProgress, Typography } from '@material-ui/core'
import { STORIES_SUB_TYPE } from '../../../../../constants/markets'
import { resetValues } from '../../../onboardingReducer'

function CreatingWorkspaceStep (props) {
  const intl = useIntl();
  const { formData, active, classes, updateFormData, isHome } = props;
  const [, diffDispatch] = useContext(DiffContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [, versionsDispatch] = useContext(VersionsContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);

  const [workspaceInfo, setWorkspaceInfo] = useState({});
  const history = useHistory();
  const { meetingName } = formData;
  const workspaceDescription = intl.formatMessage({ id: 'WorkspaceWizardWorkspaceDescription' }, { meetingName });

  useEffect(() => {

    const { workspaceCreated } = workspaceInfo;
    if (!workspaceCreated && active) {
      const marketInfo = {
        name: meetingName,
        description: `<p>${workspaceDescription}</p>`,
        market_sub_type: STORIES_SUB_TYPE,
      };
      let marketId;
      let investibleId;
      let inProgressStage;
      let inVotingStage;
      let myUserId;
      let marketToken;
      createPlanning(marketInfo)
        .then((marketDetails) => {
          const {
            market,
            presence,
            stages,
          } = marketDetails;
          marketId = market.id;
          marketToken = market.invite_capability;
          setWorkspaceInfo({ workspaceCreated: true, marketId, marketToken });
          myUserId = presence.id;
          addMarketToStorage(marketsDispatch, diffDispatch, market);
          addPresenceToMarket(presenceDispatch, marketId, presence);
          inVotingStage = stages.find((stage) => stage.allows_investment);
          inProgressStage = stages.find((stage) => stage.singular_only);
          // add the next story if you have it
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
          if (_.isNumber(currentStoryEstimate) && currentStoryEstimate > 0 && !currentStoryProgressSkipped) {
            addInfo.daysEstimate = currentStoryEstimate;
          }
          return addPlanningInvestible(addInfo);
        })
        .then((investible) => {
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
        .then((investible) => {
          addInvestible(investiblesDispatch, diffDispatch, investible);
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
          updateFormData(resetValues());
          if(isHome) {
            const link = formMarketManageLink(marketId) + '#participation=true';
            navigate(history, link);
          } else {
            const marketLink = formMarketLink(marketId);
            navigate(history, `${marketLink}#onboarded=true`);
          }
        });
    }
  }, [workspaceInfo, active, commentsDispatch, commentsState, diffDispatch, versionsDispatch, formData, investiblesDispatch, marketsDispatch, presenceDispatch, meetingName, workspaceDescription, updateFormData, isHome, history]);

  if (!active) {
    return React.Fragment;
  }

  return (
    <div>
        <div className={classes.creatingContainer}>
          <Typography variant="body1">
            We're creating your Uclusion Workspace now, please wait a moment.
          </Typography>
          <CircularProgress className={classes.loadingColor} size={120} type="indeterminate"/>
        </div>
    </div>
  );
}

CreatingWorkspaceStep.propTypes = {
  formData: PropTypes.object,
  active: PropTypes.bool,
  updateFormData: PropTypes.func,
  isHome: PropTypes.bool,
};

CreatingWorkspaceStep.defaultProps = {
  formData: {},
  active: false,
  updateFormData: () => {},
  isHome: false,
};



export default CreatingWorkspaceStep;