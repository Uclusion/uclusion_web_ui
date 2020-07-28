import React, { useContext, useEffect } from 'react'
import PropTypes from 'prop-types'
import StepButtons from '../../StepButtons'
import { DiffContext } from '../../../../contexts/DiffContext/DiffContext'
import { InvestiblesContext } from '../../../../contexts/InvestibesContext/InvestiblesContext'
import { MarketsContext } from '../../../../contexts/MarketsContext/MarketsContext'
import { formInvestibleLink, navigate } from '../../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { MarketPresencesContext } from '../../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { Button, CircularProgress, Typography } from '@material-ui/core'
import InviteLinker from '../../../Dialog/InviteLinker'
import { INITIATIVE_TYPE } from '../../../../constants/markets'
import { createMyInitiative } from './initiativeCreator';

function CreatingInitiativeStep (props) {
  const { formData, updateFormData, active, classes, operationStatus, setOperationStatus, onFinish, isHome } = props;
  const [, diffDispatch] = useContext(DiffContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const { marketId, investibleId, initiativeCreated, initiativeError, marketToken } = operationStatus;
  const history = useHistory();

  useEffect(() => {

    if (active && initiativeCreated && marketId && isHome) {
      onFinish({ ...formData, marketId });
    }

  }, [active, formData, initiativeCreated, onFinish, isHome, marketId]);

  const marketLink = formInvestibleLink(marketId, investibleId);

  function retryInitiative() {
    const dispatchers = {
      diffDispatch,
      investiblesDispatch,
      marketsDispatch,
      presenceDispatch
    };
    createMyInitiative(dispatchers, formData, updateFormData, setOperationStatus)
  }

  if (!active) {
    return React.Fragment;
  }

  if (initiativeError) {
    return (
      <div className={classes.retryContainer}>
        <Button className={classes.actionStartOver}
                onClick={() => {
                  setOperationStatus({});
                  retryInitiative();
                }}
        >
          Retry Creating Initiative
        </Button>

      </div>
    );
  }

  return (
    <div>
      {(!initiativeCreated || isHome) && (
        <div className={classes.creatingContainer}>
          <Typography variant="body1">
            We're creating your Uclusion Initiative now, please wait a moment.
          </Typography>
          <CircularProgress className={classes.loadingColor} size={120} type="indeterminate"/>
        </div>
      )}
      {!isHome && initiativeCreated && (
        <div>
          <Typography variant="body1">
            We've created your Initiative, please share the link below.
          </Typography>
          <div className={classes.linkContainer}>
            <InviteLinker
              marketType={INITIATIVE_TYPE}
              marketToken={marketToken}
            />
          </div>
          <div className={classes.borderBottom}></div>
          <StepButtons
            {...props}
            showGoBack={false}
            finishLabel="InitiativeWizardTakeMeToInitiative"
            showStartOver={false}
            onFinish={() => navigate(history, marketLink)}/>
        </div>
      )}
    </div>
  );
}

CreatingInitiativeStep.propTypes = {
  formData: PropTypes.object,
  active: PropTypes.bool,
  operationStatus: PropTypes.object,
  setOperationStatus: PropTypes.func,
  isHome: PropTypes.bool,
  onFinish: PropTypes.func,
};

CreatingInitiativeStep.defaultProps = {
  formData: {},
  active: false,
  operationStatus: {},
  setOperationStatus: () => {},
  isHome: false,
  onFinish: () => {},
};

export default CreatingInitiativeStep;