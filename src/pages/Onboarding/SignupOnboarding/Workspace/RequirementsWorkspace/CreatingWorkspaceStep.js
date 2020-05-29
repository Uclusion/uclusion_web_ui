import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import StepButtons from '../../../StepButtons'
import { createPlanning } from '../../../../../api/markets'
import { addMarketToStorage } from '../../../../../contexts/MarketsContext/marketsContextHelper'
import { processTextAndFilesForSave } from '../../../../../api/files'
import { DiffContext } from '../../../../../contexts/DiffContext/DiffContext'
import { MarketsContext } from '../../../../../contexts/MarketsContext/MarketsContext'
import { formMarketLink, formMarketManageLink, navigate } from '../../../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router'
import { addPresenceToMarket } from '../../../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { saveComment } from '../../../../../api/comments'
import { TODO_TYPE } from '../../../../../constants/comments';
import { addCommentToMarket } from '../../../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../../../contexts/CommentsContext/CommentsContext'
import { VersionsContext } from '../../../../../contexts/VersionsContext/VersionsContext'
//import { useIntl } from 'react-intl'
import { CircularProgress, Typography } from '@material-ui/core';
import InviteLinker from '../../../../Dialog/InviteLinker'
import { PLANNING_TYPE, REQUIREMENTS_SUB_TYPE } from '../../../../../constants/markets';
import { resetValues } from '../../../onboardingReducer';

function CreatingWorkspaceStep (props) {
//  const intl = useIntl();
  const { formData, active, classes, updateFormData, isHome } = props;
  const [, diffDispatch] = useContext(DiffContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [, versionsDispatch] = useContext(VersionsContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
 const [workspaceInfo, setWorkspaceInfo] = useState({});
  const history = useHistory();
  useEffect(() => {
    const { workspaceCreated } = workspaceInfo;
    if (!workspaceCreated && active) {
      const {
        workspaceName,
        workspaceDescription,
        workspaceDescriptionUploadedFiles
      } = formData;
      const processed = processTextAndFilesForSave(workspaceDescriptionUploadedFiles, workspaceDescription);
      const marketInfo = {
        name: workspaceName,
        description: processed.text,
        uploaded_files: processed.uploadedFiles,
        market_sub_type: REQUIREMENTS_SUB_TYPE,
      };
      let marketId;
      let marketToken;
      createPlanning(marketInfo)
        .then((marketDetails) => {
          const {
            market,
            presence,
          } = marketDetails;
          marketId = market.id;
          marketToken = market.invite_capability;
          setWorkspaceInfo({ workspaceCreated: true, marketId, marketToken });
          addMarketToStorage(marketsDispatch, diffDispatch, market);
          addPresenceToMarket(presenceDispatch, marketId, presence);
          const { todo, todoSkipped, todoUploadedFiles } = formData;
          if (!_.isEmpty(todo) && !todoSkipped) {
            const processed = processTextAndFilesForSave(todoUploadedFiles, todo);
            return saveComment(marketId, undefined, undefined, processed.text, TODO_TYPE, processed.uploadedFiles);
          } else {
            return Promise.resolve(false);
          }
        })
        .then((addedComment) => {
          if (addedComment) {
            addCommentToMarket(addedComment, commentsState, commentsDispatch, versionsDispatch);
          }
        })
        .then(() => {
          updateFormData(resetValues());
          //send them directly to the market invite if home
          if(isHome) {
            const link = formMarketManageLink(marketId) + '#participation=true';
            navigate(history, link);
          }
        });
    }
  }, [
    workspaceInfo, active, commentsDispatch, commentsState,
    diffDispatch, versionsDispatch, formData, updateFormData,
    marketsDispatch, presenceDispatch,
  ]);
  const { marketId, workspaceCreated, marketToken } = workspaceInfo;
  const marketLink = formMarketLink(marketId);

  if (!active) {
    return React.Fragment;
  }

  return (
    <div>
      {!workspaceCreated && (
        <div className={classes.creatingContainer}>
          <Typography variant="body1">
            We're creating your Uclusion Workspace now, please wait a moment.
          </Typography>
          <CircularProgress className={classes.loadingColor} size={120} type="indeterminate"/>
        </div>
      )}
      {!isHome && workspaceCreated && (
        <div>
          <Typography variant="body1">
            We've created your Workspace, please share this link with your team to invite them
          </Typography>
          <div className={classes.linkContainer}>
            <InviteLinker
              marketType={PLANNING_TYPE}
              marketToken={marketToken}
            />
          </div>
          <div className={classes.borderBottom}></div>
          <StepButtons
            {...props}
            showGoBack={false}
            finishLabel="WorkspaceWizardTakeMeToWorkspace"
            showStartOver={false}
            onFinish={() => navigate(history, marketLink)}/>
        </div>
      )}
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
  updateFormData: () => {},
  active: false,
  isHome: false,
};



export default CreatingWorkspaceStep;