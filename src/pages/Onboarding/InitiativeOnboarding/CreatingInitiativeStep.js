import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import StepButtons from '../StepButtons';
import { createInitiative } from '../../../api/markets';
import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper';
import { processTextAndFilesForSave } from '../../../api/files';
import { addDecisionInvestible } from '../../../api/investibles';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { addInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { addPresenceToMarket } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { Typography } from '@material-ui/core';
import InviteLinker from '../../Dialog/InviteLinker';
import { INITIATIVE_TYPE } from '../../../constants/markets';

function CreatingInitiativeStep (props) {
  const { formData, active, classes } = props;
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
    const { initiativeCreated } = initiativeInfo;
    if (!initiativeCreated && active) {
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
        });
    }
  }, [
    initiativeInfo, active,
    diffDispatch, formData, investiblesDispatch,
    marketsDispatch, presenceDispatch,
  ]);
  const { marketId, initiativeCreated, marketToken } = initiativeInfo;
  const marketLink = formMarketLink(marketId);

  if (!active) {
    return React.Fragment;
  }

  return (
    <div>
      {!initiativeCreated && (
        <div>
          We're creating your Uclusion Initiative now, please wait a moment.
        </div>

      )}
      {initiativeCreated && (
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
            finishLabel={'InitiativeWizardTakeMeToInitiative'}
            onFinish={() => navigate(history, marketLink)}/>
        </div>
      )}
    </div>
  );
}

CreatingInitiativeStep.propTypes = {
  formData: PropTypes.object,
  active: PropTypes.bool,
};

CreatingInitiativeStep.defaultProps = {
  formData: {},
  active: false,
};

export default CreatingInitiativeStep;