import React, { useContext, useEffect } from 'react'
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
import { Button, CircularProgress, Typography } from '@material-ui/core'
import { STORIES_SUB_TYPE } from '../../../../../constants/markets'

function CreatingWorkspaceStep (props) {
  const intl = useIntl();
  const { formData, active, classes, onFinish, isHome, operationStatus, setOperationStatus } = props;
  const [, diffDispatch] = useContext(DiffContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [, versionsDispatch] = useContext(VersionsContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const history = useHistory();
  const { meetingName } = formData;
  const workspaceDescription = intl.formatMessage({ id: 'WorkspaceWizardWorkspaceDescription' }, { meetingName });

  useEffect(() => {

    const { workspaceCreated, workspaceError, started } = operationStatus;
    if (!started && !workspaceCreated && !workspaceError && active) {
      setOperationStatus({started: true});
      const marketInfo = {
        name: meetingName,
        description: `<p>${workspaceDescription}</p>`,
        market_sub_type: STORIES_SUB_TYPE,
      };
      let createdMarketId;
      let investibleId;
      let inProgressStage;
      let inVotingStage;
      let myUserId;
      let createdMarketToken;
      createPlanning(marketInfo)
        .then((marketDetails) => {
          const {
            market,
            presence,
            stages,
          } = marketDetails;
          createdMarketId = market.id;
          createdMarketToken = market.invite_capability;
          setOperationStatus({ workspaceCreated: true, marketId: createdMarketId, marketToken: createdMarketToken });
          myUserId = presence.id;
          addMarketToStorage(marketsDispatch, diffDispatch, market);
          addPresenceToMarket(presenceDispatch, createdMarketId, presence);
          inVotingStage = stages.find((stage) => stage.allows_investment);
          inProgressStage = stages.find((stage) => stage.singular_only);
          // add the next story if you have it
          const { nextStoryName, nextStoryDescription, nextStoryUploadedFiles, nextStorySkipped } = formData;
          if (!_.isEmpty(nextStoryName) && !nextStorySkipped) {
            const usedUploads = nextStoryUploadedFiles || [];
            const processed = processTextAndFilesForSave(usedUploads, nextStoryDescription);
            // add the story
            const addInfo = {
              marketId: createdMarketId,
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
            marketId: createdMarketId,
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
            marketId: createdMarketId,
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
            return saveComment(createdMarketId, investibleId, undefined, currentStoryProgress, REPORT_TYPE, []);
          } else {
            return Promise.resolve(false);
          }
        })
        .then((addedComment) => {
          if (addedComment) {
            addCommentToMarket(addedComment, commentsState, commentsDispatch, versionsDispatch);
          }
          if(isHome) {
            onFinish(formData);
            const link = formMarketManageLink(createdMarketId) + '#participation=true';
            navigate(history, link);
          } else {
            onFinish(formData);
            const marketLink = formMarketLink(createdMarketId);
            navigate(history, `${marketLink}#onboarded=true`);
          }
        })
        .catch(() => {
          setOperationStatus({started: false, workspaceError: true});
        });
    }
  }, [active, commentsDispatch, commentsState, diffDispatch, onFinish,
    versionsDispatch, formData, investiblesDispatch, marketsDispatch, presenceDispatch, meetingName,
    workspaceDescription, isHome, history, operationStatus, setOperationStatus]);

  if (!active) {
    return React.Fragment;
  }

  const { workspaceError } = operationStatus;

  if (workspaceError) {
    return (
      <div className={classes.retryContainer}>
        <Button className={classes.actionStartOver}
                onClick={() => setOperationStatus({})}
        >
          Retry Creating Workspace
        </Button>
      </div>
    );
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
  operationStatus: PropTypes.object,
  setOperationStatus: PropTypes.func,
  isHome: PropTypes.bool,
  onFinish: PropTypes.func,
};

CreatingWorkspaceStep.defaultProps = {
  formData: {},
  active: false,
  operationStatus: {},
  setOperationStatus: () => {},
  isHome: false,
  onFinish: () => {},
};



export default CreatingWorkspaceStep;