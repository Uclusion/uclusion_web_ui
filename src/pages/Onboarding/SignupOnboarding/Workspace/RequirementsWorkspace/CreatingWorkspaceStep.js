import React, { useContext, useEffect } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import StepButtons from '../../../StepButtons'
import { createPlanning } from '../../../../../api/markets'
import { addMarketToStorage } from '../../../../../contexts/MarketsContext/marketsContextHelper'
import { processTextAndFilesForSave } from '../../../../../api/files'
import { DiffContext } from '../../../../../contexts/DiffContext/DiffContext'
import { MarketsContext } from '../../../../../contexts/MarketsContext/MarketsContext'
import { formMarketLink, formMarketManageLink, navigate } from '../../../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { addPresenceToMarket } from '../../../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { saveComment } from '../../../../../api/comments'
import { TODO_TYPE } from '../../../../../constants/comments'
import { addCommentToMarket } from '../../../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../../../contexts/CommentsContext/CommentsContext'
import { VersionsContext } from '../../../../../contexts/VersionsContext/VersionsContext'
import { Button, CircularProgress, Typography } from '@material-ui/core'
import InviteLinker from '../../../../Dialog/InviteLinker'
import { PLANNING_TYPE, REQUIREMENTS_SUB_TYPE } from '../../../../../constants/markets'
import { pushMessage } from '../../../../../utils/MessageBusUtils'
import { PUSH_STAGE_CHANNEL, VERSIONS_EVENT } from '../../../../../contexts/VersionsContext/versionsContextHelper'

function CreatingWorkspaceStep (props) {
//  const intl = useIntl();
  const { formData, active, classes, onFinish, operationStatus, setOperationStatus, isHome } = props;
  const [, diffDispatch] = useContext(DiffContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [, versionsDispatch] = useContext(VersionsContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);

  const history = useHistory();
  useEffect(() => {
    const {
      workspaceCreated,
      workspaceError,
      started,
    } = operationStatus;
    const {
      workspaceName,
      workspaceDescription,
      workspaceDescriptionUploadedFiles,
      } = formData;
    if (!started && !workspaceCreated && !workspaceError && active) {
      setOperationStatus({ started: true });
      const processed = processTextAndFilesForSave(workspaceDescriptionUploadedFiles, workspaceDescription);
      const marketInfo = {
        name: workspaceName,
        description: processed.text,
        uploaded_files: processed.uploadedFiles,
        market_sub_type: REQUIREMENTS_SUB_TYPE,
      };
      let createdMarketId;
      let createdMarketToken;
      async function doIt () {
        await createPlanning(marketInfo)
          .then((marketDetails) => {
            const {
              market,
              presence,
              stages
            } = marketDetails;
            createdMarketId = market.id;
            createdMarketToken = market.invite_capability;
            setOperationStatus({ workspaceCreated: true, marketId: createdMarketId, marketToken: createdMarketToken });
            addMarketToStorage(marketsDispatch, diffDispatch, market);
            pushMessage(PUSH_STAGE_CHANNEL, { event: VERSIONS_EVENT, marketId: createdMarketId, stages });
            addPresenceToMarket(presenceDispatch, createdMarketId, presence);
            const { todo, todoSkipped, todoUploadedFiles } = formData;
            if (!_.isEmpty(todo) && !todoSkipped) {
              const processed = processTextAndFilesForSave(todoUploadedFiles, todo);
              return saveComment(createdMarketId, undefined, undefined, processed.text, TODO_TYPE, processed.uploadedFiles);
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
            //send them directly to the market invite if home
            if (isHome) {
              onFinish(formData);
              const link = formMarketManageLink(createdMarketId) + '#participation=true';
              navigate(history, link);
            }
          })
          .catch(() => {
            setOperationStatus({ started: false, workspaceError: true });
          });
      }

      doIt();
    }
  }, [active, commentsDispatch, commentsState, diffDispatch, onFinish, operationStatus, setOperationStatus,
    versionsDispatch, formData, marketsDispatch, presenceDispatch, isHome, history]);
  const { marketId, workspaceCreated, marketToken, workspaceError } = operationStatus;
  const marketLink = formMarketLink(marketId);

  if (!active) {
    return React.Fragment;
  }

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
      {(!workspaceCreated || isHome) && (
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
  operationStatus: PropTypes.object,
  setOperationStatus: PropTypes.func,
  isHome: PropTypes.bool,
  onFinish: PropTypes.func,
};

CreatingWorkspaceStep.defaultProps = {
  formData: {},
  operationStatus: {},
  setOperationStatus: () => {},
  active: false,
  isHome: false,
  onFinish: () => {},
};



export default CreatingWorkspaceStep;