import React, { useContext, useEffect } from 'react'
import PropTypes from 'prop-types'
import StepButtons from '../../StepButtons'
import { createInitiative } from '../../../../api/markets'
import { addMarketToStorage } from '../../../../contexts/MarketsContext/marketsContextHelper'
import { processTextAndFilesForSave } from '../../../../api/files'
import { addDecisionInvestible } from '../../../../api/investibles'
import { DiffContext } from '../../../../contexts/DiffContext/DiffContext'
import { InvestiblesContext } from '../../../../contexts/InvestibesContext/InvestiblesContext'
import { MarketsContext } from '../../../../contexts/MarketsContext/MarketsContext'
import { addInvestible } from '../../../../contexts/InvestibesContext/investiblesContextHelper'
import { formInvestibleLink, navigate } from '../../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { addPresenceToMarket } from '../../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { Button, CircularProgress, Typography } from '@material-ui/core'
import InviteLinker from '../../../Dialog/InviteLinker'
import { INITIATIVE_TYPE } from '../../../../constants/markets'

function CreatingInitiativeStep (props) {
  const { formData, active, classes, operationStatus, setOperationStatus, onFinish, isHome } = props;
  const [, diffDispatch] = useContext(DiffContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);

  const history = useHistory();

  useEffect(() => {
    const {
      initiativeCreated,
      initiativeError,
      started,
    } = operationStatus;
    const {
      initiativeName,
      initiativeDescription,
      initiativeDescriptionUploadedFiles,
      initiativeExpiration,
      marketId,
    } = formData;
    const realUploadedFiles = initiativeDescriptionUploadedFiles || [];
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(realUploadedFiles, initiativeDescription);
    if (!started && !initiativeCreated && !initiativeError && active) {
      setOperationStatus({started: true});
      const marketInfo = {
        name: 'NA',
        description: 'NA',
        expiration_minutes: initiativeExpiration,
      };
      let createdMarketId;
      let createdMarketToken;
      createInitiative(marketInfo)
        .then((result) => {
          const {
            market,
            presence,
          } = result;
          createdMarketId = market.id;
          createdMarketToken = market.invite_capability;
          const investibleInfo = {
            marketId: createdMarketId,
            uploadedFiles: filteredUploads,
            description: tokensRemoved,
            name: initiativeName,
          };
          addMarketToStorage(marketsDispatch, diffDispatch, market);
          addPresenceToMarket(presenceDispatch, marketId, presence);
          return addDecisionInvestible(investibleInfo)
            .then((investible) => {
              const { investible: myInvestible } = investible;
              const { id } = myInvestible;
              addInvestible(investiblesDispatch, diffDispatch, investible);
              setOperationStatus({ initiativeCreated: true, marketId: createdMarketId, investibleId: id,
                marketToken: createdMarketToken });
            });
        }).then(() => {
          if(isHome) {
            onFinish({...formData, marketId: createdMarketId});
          }
        })
        .catch(() => {
          setOperationStatus({ initiativeError: true, started: false});
        });
    }
  }, [diffDispatch, formData, active, investiblesDispatch, onFinish, marketsDispatch, operationStatus,
    setOperationStatus, presenceDispatch, isHome, history]);

  const { marketId, investibleId, initiativeCreated, initiativeError, marketToken } = operationStatus;
  const marketLink = formInvestibleLink(marketId, investibleId);

  if (!active) {
    return React.Fragment;
  }

  if (initiativeError) {
    return (
      <div className={classes.retryContainer}>
        <Button className={classes.actionStartOver}
                onClick={() => setOperationStatus({})}
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