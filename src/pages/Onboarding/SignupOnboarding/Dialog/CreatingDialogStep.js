import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DiffContext } from '../../../../contexts/DiffContext/DiffContext';
import { InvestiblesContext } from '../../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketsContext } from '../../../../contexts/MarketsContext/MarketsContext';
import { formMarketLink, navigate } from '../../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { MarketPresencesContext } from '../../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { Button, CircularProgress, Typography } from '@material-ui/core';
import { createMyDialog } from './dialogCreator';

function CreatingDialogStep (props) {
  const { formData, updateFormData, active, classes, operationStatus, setOperationStatus, isHome, onFinish } = props;
  const [, diffDispatch] = useContext(DiffContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const history = useHistory();
  const {
    dialogCreated,
    marketId,
    dialogError,
  } = operationStatus;

  useEffect(() => {
    if (active && marketId && dialogCreated) {
      if (isHome) {
        onFinish({ ...formData, marketId });
      } else {
        const marketLink = formMarketLink(marketId);
        navigate(history, `${marketLink}#onboarded=true`);
      }
    }
  }, [active, formData, onFinish, isHome, history, marketId, dialogCreated]);

  function retryDialog () {
    const dispatchers = {
      investiblesDispatch,
      marketsDispatch,
      presenceDispatch,
      diffDispatch,
    };
    createMyDialog(dispatchers, formData, updateFormData, setOperationStatus);
  }

  if (!active) {
    return React.Fragment;
  }

  if (dialogError) {
    return (
      <div className={classes.retryContainer}>
        <Button className={classes.actionStartOver}
                onClick={() => {
                  setOperationStatus({});
                  retryDialog();
                }}
        >
          Retry Creating Dialog
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className={classes.creatingContainer}>
        <Typography variant="body1">
          We're creating your Uclusion Dialog now, please wait a moment.
        </Typography>
        <CircularProgress className={classes.loadingColor} size={120} type="indeterminate"/>
      </div>
    </div>
  );
}

CreatingDialogStep.propTypes = {
  formData: PropTypes.object,
  active: PropTypes.bool,
  operationStatus: PropTypes.object,
  setOperationStatus: PropTypes.func,
  isHome: PropTypes.bool,
  onFinish: PropTypes.func,
};

CreatingDialogStep.defaultProps = {
  formData: {},
  active: false,
  operationStatus: {},
  setOperationStatus: () => {},
  isHome: false,
  onFinish: () => {},
};

export default CreatingDialogStep;