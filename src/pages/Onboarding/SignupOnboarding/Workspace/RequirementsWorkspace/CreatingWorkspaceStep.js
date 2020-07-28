import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import StepButtons from '../../../StepButtons';
import { formMarketLink, navigate } from '../../../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { Button, CircularProgress, Typography } from '@material-ui/core';
import InviteLinker from '../../../../Dialog/InviteLinker';
import { PLANNING_TYPE } from '../../../../../constants/markets';
import { doCreateRequirementsWorkspace } from './workspaceCreator';
import { DiffContext } from '../../../../../contexts/DiffContext/DiffContext';
import { MarketPresencesContext } from '../../../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { VersionsContext } from '../../../../../contexts/VersionsContext/VersionsContext';
import { CommentsContext } from '../../../../../contexts/CommentsContext/CommentsContext';
import { MarketsContext } from '../../../../../contexts/MarketsContext/MarketsContext';

function CreatingWorkspaceStep (props) {
//  const intl = useIntl();
  const { formData, active, classes, onFinish, updateFormData, operationStatus, setOperationStatus, isHome } = props;
  const [, diffDispatch] = useContext(DiffContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [, versionsDispatch] = useContext(VersionsContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const history = useHistory();

  const { workspaceError, workspaceCreated, marketId, marketToken } = operationStatus;
  const marketLink = formMarketLink(marketId);

  useEffect(() => {
    if (active && workspaceCreated && marketId) {
      const data = {...formData, marketId}
      onFinish(data);
    }

  }, [isHome, onFinish, workspaceCreated, marketId, history, active, formData]);

  function retryWorkspace () {
    const dispatchers = {
      marketsDispatch,
      diffDispatch,
      presenceDispatch,
      versionsDispatch,
      commentsState,
      commentsDispatch
    };
    doCreateRequirementsWorkspace(dispatchers, formData, updateFormData, setOperationStatus);
  }

  if (!active) {
    return React.Fragment;
  }

  if (workspaceError) {
    return (
      <div className={classes.retryContainer}>
        <Button className={classes.actionStartOver}
                onClick={() => {
                  setOperationStatus({});
                  retryWorkspace();
                }}
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