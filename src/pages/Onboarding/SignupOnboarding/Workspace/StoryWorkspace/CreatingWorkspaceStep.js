import React, {useEffect } from 'react'
import PropTypes from 'prop-types'
import { formMarketLink, formMarketManageLink, navigate } from '../../../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { Button, CircularProgress, Typography } from '@material-ui/core'
function CreatingWorkspaceStep (props) {
  const { formData, active, classes, onFinish, isHome, operationStatus, setOperationStatus } = props;

  const history = useHistory();

  const { workspaceError, workspaceCreated, marketId } = operationStatus;

  useEffect(() => {
    if (active && workspaceCreated && marketId) {
      if (isHome) {
        onFinish(formData);
        const link = formMarketManageLink(marketId) + '#participation=true';
        navigate(history, link);
      } else {
        onFinish(formData);
        const marketLink = formMarketLink(marketId);
        navigate(history, `${marketLink}#onboarded=true`);
      }
    }
  }, [isHome, onFinish, workspaceCreated, marketId, history, active, formData]);

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