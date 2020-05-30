import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { createDecision } from '../../../../api/markets'
import { addMarketToStorage } from '../../../../contexts/MarketsContext/marketsContextHelper'
import { processTextAndFilesForSave } from '../../../../api/files'
import { addInvestibleToStage } from '../../../../api/investibles'
import { DiffContext } from '../../../../contexts/DiffContext/DiffContext'
import { InvestiblesContext } from '../../../../contexts/InvestibesContext/InvestiblesContext'
import { MarketsContext } from '../../../../contexts/MarketsContext/MarketsContext'
import { addInvestible } from '../../../../contexts/InvestibesContext/investiblesContextHelper'
import { formMarketLink, formMarketManageLink, navigate } from '../../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { addPresenceToMarket } from '../../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { Button, CircularProgress, Typography } from '@material-ui/core'
import { AllSequentialMap } from '../../../../utils/PromiseUtils'
import { resetValues } from '../../onboardingReducer'

function CreatingDialogStep(props) {
  const { formData, active, classes, updateFormData, isHome } = props;
  const [, diffDispatch] = useContext(DiffContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);

  const [dialogInfo, setDialogInfo] = useState({});
  const history = useHistory();

  useEffect(() => {
    const { dialogName, dialogReason, dialogOptions, dialogExpiration, addOptionsSkipped } = formData;

    const { dialogCreated, dialogError } = dialogInfo;
    if (!dialogCreated && !dialogError && active) {
      const marketInfo = {
        name: dialogName,
        description: dialogReason,
        expiration_minutes: dialogExpiration,
      };
      let marketId;
      let marketToken;
      let inVotingStage;
      let createdStage;
      createDecision(marketInfo)
        .then((marketDetails) => {
          const {
            market,
            presence,
            stages,
          } = marketDetails;
          marketId = market.id;
          marketToken = market.invite_capability;
          setDialogInfo({ dialogCreated: true, marketId, marketToken });
          addMarketToStorage(marketsDispatch, diffDispatch, market);
          addPresenceToMarket(presenceDispatch, marketId, presence);
          createdStage = stages.find((stage) => !stage.allows_investment);
          inVotingStage = stages.find((stage) => stage.allows_investment);
          if (addOptionsSkipped) {
            return Promise.resolve(true);
          }
          return AllSequentialMap(dialogOptions, (option) => {
            const {
              optionUploadedFiles,
              optionName,
              optionDescription
            } = option;
            const realUploadedFiles = optionUploadedFiles || [];
            const processed = processTextAndFilesForSave(realUploadedFiles, optionDescription);
            const addInfo = {
              marketId,
              name: optionName,
              description: processed.text,
              uploadedFiles: processed.uploadedFiles,
              stageInfo: {
                current_stage_id: createdStage.id,
                stage_id: inVotingStage.id,
              },
            };
            return addInvestibleToStage(addInfo)
              .then((investible) => {
                addInvestible(investiblesDispatch, diffDispatch, investible);
              });
          });
        })
        .then(() => {
          updateFormData(resetValues());
          if(isHome) {
            const link = formMarketManageLink(marketId) + '#participation=true';
            navigate(history, link);
          } else {
            const marketLink = formMarketLink(marketId);
            navigate(history, `${marketLink}#onboarded=true`);
          }
        })
        .catch(() => {
          setDialogInfo({dialogError: true});
        });
    }
  }, [dialogInfo, active, diffDispatch, formData, investiblesDispatch, marketsDispatch, presenceDispatch, updateFormData, isHome, history]);

  if (!active) {
    return React.Fragment;
  }
  const { dialogError } = dialogInfo;
  if (dialogError) {
    return (
      <div className={classes.retryContainer}>
        <Button className={classes.actionStartOver}
          onClick={() => setDialogInfo({dialogCreated: false, dialogError: false})}
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
  updateFormData: PropTypes.func,
  isHome: PropTypes.bool,
};

CreatingDialogStep.defaultProps = {
  formData: {},
  active: false,
  updateFormData: () => {},
  isHome: false,
};

export default CreatingDialogStep;