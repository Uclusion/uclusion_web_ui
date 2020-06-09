import React, { useContext, useEffect } from 'react'
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
import { updateValues } from '../../onboardingReducer';


function CreatingDialogStep(props) {
  const { formData, active, classes, updateFormData, isHome, onFinish } = props;
  const [, diffDispatch] = useContext(DiffContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const history = useHistory();

  useEffect(() => {
    const {
      dialogName,
      dialogReason,
      dialogOptions,
      dialogExpiration,
      addOptionsSkipped,
      marketId,
      started,
      dialogCreated,
      dialogError,
    } = formData;

    if (!started && !dialogCreated && !dialogError && active) {
      updateFormData(updateValues({started: true}));
      const marketInfo = {
        name: dialogName,
        description: dialogReason,
        expiration_minutes: dialogExpiration,
      };
      let createdMarketId;
      let createdMarketToken;
      let inVotingStage;
      let createdStage;
      createDecision(marketInfo)
        .then((marketDetails) => {
          const {
            market,
            presence,
            stages,
          } = marketDetails;
          createdMarketId = market.id;
          createdMarketToken = market.invite_capability;
          updateFormData(updateValues({ dialogCreated: true, marketId: createdMarketId, marketToken: createdMarketToken }));
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
          if(isHome) {
            const link = formMarketManageLink(marketId) + '#participation=true';
            onFinish({...formData, marketLink: link});
          } else {
            onFinish(formData);
            const marketLink = formMarketLink(marketId);
            navigate(history, `${marketLink}#onboarded=true`);
          }
        })
        .catch(() => {
          updateFormData(updateValues({started: false, dialogError: true}));
        });
    }
  }, [onFinish, active, diffDispatch, formData,
    investiblesDispatch, marketsDispatch, presenceDispatch, updateFormData, isHome, history]);

  if (!active) {
    return React.Fragment;
  }
  const { dialogError } = formData;
  if (dialogError) {
    return (
      <div className={classes.retryContainer}>
        <Button className={classes.actionStartOver}
          onClick={() => updateFormData(updateValues({started: false, dialogCreated: false, dialogError: false}))}
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
  onFinish: PropTypes.func,
};

CreatingDialogStep.defaultProps = {
  formData: {},
  active: false,
  updateFormData: () => {},
  isHome: false,
  onFinish: () => {},
};

export default CreatingDialogStep;