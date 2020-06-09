import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import StepButtons from '../../StepButtons';
import { createInitiative } from '../../../../api/markets';
import { addMarketToStorage } from '../../../../contexts/MarketsContext/marketsContextHelper';
import { processTextAndFilesForSave } from '../../../../api/files';
import { addDecisionInvestible } from '../../../../api/investibles';
import { DiffContext } from '../../../../contexts/DiffContext/DiffContext';
import { InvestiblesContext } from '../../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketsContext } from '../../../../contexts/MarketsContext/MarketsContext';
import { addInvestible } from '../../../../contexts/InvestibesContext/investiblesContextHelper';
import { formMarketLink, navigate } from '../../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { addPresenceToMarket } from '../../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { CircularProgress, Typography, Button } from '@material-ui/core';
import InviteLinker from '../../../Dialog/InviteLinker';
import { INITIATIVE_TYPE } from '../../../../constants/markets';
import { updateValues } from '../../onboardingReducer';

function CreatingInitiativeStep (props) {
  const { formData, active, classes, updateFormData, onFinish, isHome } = props;
  const [, diffDispatch] = useContext(DiffContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);

  const history = useHistory();

  useEffect(() => {
    const {
      initiativeName,
      initiativeDescription,
      initiativeDescriptionUploadedFiles,
      initiativeExpiration,
      initiativeCreated,
      initiativeError,
      marketId,
      started,
    } = formData;
    const realUploadedFiles = initiativeDescriptionUploadedFiles || [];
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(realUploadedFiles, initiativeDescription);
    if (!started && !initiativeCreated && !initiativeError && active) {
      updateFormData(updateValues({started: true}));
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
              updateFormData(updateValues({ initiativeCreated: true, marketId: createdMarketId, marketToken: createdMarketToken }));
            });
        })
        .catch(() => {
          updateFormData(updateValues({ initiativeError: true, started: false}));
        });
    }
    if (initiativeCreated && !initiativeError) {
      alert('Finishing');
      onFinish(formData);
    }
  }, [ diffDispatch, formData, active, investiblesDispatch, onFinish, marketsDispatch,
  updateFormData, presenceDispatch
  ]);

  const { marketId, initiativeCreated, marketToken, initiativeError } = formData;
  const marketLink = formMarketLink(marketId);

  if (!active) {
    return React.Fragment;
  }

  if (initiativeError) {
    return (
      <div className={classes.retryContainer}>
        <Button className={classes.actionStartOver}
                onClick={() => updateFormData(updateValues({ initiativeCreated: false, initiativeError: false }))}
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
  onFinish: PropTypes.func,
};

CreatingInitiativeStep.defaultProps = {
  formData: {},
  active: false,
  updateFormData: () => {},
  isHome: false,
  onFinish: () => {},
};

export default CreatingInitiativeStep;