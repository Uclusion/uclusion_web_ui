import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types'
import { formMarketLink, navigate } from '../../../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { Button, CircularProgress, Typography } from '@material-ui/core'
import { MarketsContext } from '../../../../../contexts/MarketsContext/MarketsContext';
import { DiffContext } from '../../../../../contexts/DiffContext/DiffContext';
import { InvestiblesContext } from '../../../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketPresencesContext } from '../../../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { VersionsContext } from '../../../../../contexts/VersionsContext/VersionsContext';
import { CommentsContext } from '../../../../../contexts/CommentsContext/CommentsContext';
import { doCreateStoryWorkspace } from './workspaceCreator';
import { useIntl } from 'react-intl';
function CreatingWorkspaceStep (props) {
  const { formData, active, classes, onFinish, isHome, operationStatus, updateFormData, setOperationStatus } = props;
  const intl = useIntl();
  const history = useHistory();
  const { workspaceError, workspaceCreated, marketId } = operationStatus;
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [, versionsDispatch] = useContext(VersionsContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);

  useEffect(() => {
    if (active && workspaceCreated && marketId) {
      onFinish({...formData, marketId});
      if (!isHome){
        const marketLink = formMarketLink(marketId);
        navigate(history, `${marketLink}#onboarded=true`);
      }
    }
  }, [isHome, onFinish, workspaceCreated, marketId, history, active, formData]);

  function retryWorkspace(){
    const dispatchers = {
      diffDispatch,
      investiblesDispatch,
      marketsDispatch,
      presenceDispatch,
      versionsDispatch,
      commentsDispatch,
      commentsState,
    };
    doCreateStoryWorkspace(dispatchers, formData, updateFormData, intl, setOperationStatus)
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