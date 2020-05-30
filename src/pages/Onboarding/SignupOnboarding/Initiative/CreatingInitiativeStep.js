import React, { useContext, useEffect, useState } from 'react'
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
import { formMarketLink, formMarketManageLink, navigate } from '../../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { addPresenceToMarket } from '../../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { CircularProgress, Typography, Button } from '@material-ui/core'
import InviteLinker from '../../../Dialog/InviteLinker'
import { INITIATIVE_TYPE } from '../../../../constants/markets'
import { resetValues } from '../../onboardingReducer'

function CreatingInitiativeStep (props) {
  const { formData, active, classes, updateFormData, isHome } = props;
  const [, diffDispatch] = useContext(DiffContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);

  const [initiativeInfo, setDialogInfo] = useState({});
  const history = useHistory();

  useEffect(() => {
    const {
      initiativeName,
      initiativeDescription,
      initiativeDescriptionUploadedFiles,
      initiativeExpiration
    } = formData;
    const realUploadedFiles = initiativeDescriptionUploadedFiles || [];
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(realUploadedFiles, initiativeDescription);
    const { initiativeCreated, initiativeError } = initiativeInfo;
    if (!initiativeCreated && !initiativeError && active) {
      const marketInfo = {
        name: 'NA',
        description: 'NA',
        expiration_minutes: initiativeExpiration,
      };
      let marketId;
      let marketToken;
      createInitiative(marketInfo)
        .then((result) => {
          const {
            market,
            presence,
          } = result;
          marketId = market.id;
          marketToken = market.invite_capability;
          const investibleInfo = {
            marketId,
            uploadedFiles: filteredUploads,
            description: tokensRemoved,
            name: initiativeName,
          };
          addMarketToStorage(marketsDispatch, diffDispatch, market);
          addPresenceToMarket(presenceDispatch, marketId, presence);
          return addDecisionInvestible(investibleInfo)
            .then((investible) => {
            addInvestible(investiblesDispatch, diffDispatch, investible);
            setDialogInfo({ initiativeCreated: true, marketId, marketToken });
          });
        })
        .then(() => {
          updateFormData(resetValues());
          if(isHome) {
            const link = formMarketManageLink(marketId) + '#participation=true';
            navigate(history, link);
          }
        })
        .catch(() => {
          setDialogInfo({initiativeError: true});
        })
      ;
    }
  }, [initiativeInfo, active, diffDispatch, formData, investiblesDispatch, marketsDispatch, presenceDispatch, updateFormData, isHome, history]);
  const { marketId, initiativeCreated, marketToken, initiativeError } = initiativeInfo;
  const marketLink = formMarketLink(marketId);

  if (!active) {
    return React.Fragment;
  }

  if (initiativeError) {
    return (
      <div className={classes.retryContainer}>
        <Button className={classes.actionStartOver}
          onClick={() => setDialogInfo({initiativeCreated: false, initiativeError: false})}
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
  updateFormData: PropTypes.func,
  isHome: PropTypes.bool,
};

CreatingInitiativeStep.defaultProps = {
  formData: {},
  active: false,
  updateFormData: () => {},
  isHome: false,
};

export default CreatingInitiativeStep;