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


function CreatingDialogStep(props) {
  const { formData, active, classes, operationStatus, setOperationStatus, isHome, onFinish } = props;
  const [, diffDispatch] = useContext(DiffContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const history = useHistory();

  useEffect(() => {
    const {
      started,
      dialogCreated,
      dialogError,
    } = operationStatus;
    const {
      dialogName,
      dialogReason,
      dialogOptions,
      dialogExpiration,
      addOptionsSkipped,
      marketId,

    } = formData;

    if (!started && !dialogCreated && !dialogError && active) {
      setOperationStatus({started: true});
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
          setOperationStatus({ dialogCreated: true, marketId: createdMarketId, marketToken: createdMarketToken });
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
              marketId: createdMarketId,
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
            const link = formMarketManageLink(createdMarketId) + '#participation=true';
            onFinish({...formData, marketLink: link});
          } else {
            const marketLink = formMarketLink(createdMarketId);
            onFinish(formData);
            navigate(history, `${marketLink}#onboarded=true`);
          }
        })
        .catch(() => {
          setOperationStatus({dialogError: true});
        });
    }
  }, [onFinish, active, diffDispatch, formData, operationStatus, setOperationStatus,
    investiblesDispatch, marketsDispatch, presenceDispatch, isHome, history]);

  if (!active) {
    return React.Fragment;
  }
  const { dialogError } = operationStatus;
  if (dialogError) {
    return (
      <div className={classes.retryContainer}>
        <Button className={classes.actionStartOver}
          onClick={() => setOperationStatus({})}
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