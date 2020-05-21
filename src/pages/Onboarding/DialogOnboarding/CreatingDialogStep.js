import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import StepButtons from '../StepButtons';
import { createDecision} from '../../../api/markets';
import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper';
import { processTextAndFilesForSave } from '../../../api/files';
import { addInvestibleToStage } from '../../../api/investibles';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { addInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { addPresenceToMarket } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
//import { useIntl } from 'react-intl';
import { Typography } from '@material-ui/core';
import InviteLinker from '../../Dialog/InviteLinker';
import { DECISION_TYPE } from '../../../constants/markets';
import { AllSequentialMap } from '../../../utils/PromiseUtils';

function CreatingDialogStep (props) {
 // const intl = useIntl();
  const { formData, active, classes } = props;
  const [, diffDispatch] = useContext(DiffContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);

  const [dialogInfo, setDialogInfo] = useState({});
  const history = useHistory();

  useEffect(() => {
    const { dialogName, dialogReason, dialogOptions, dialogExpiration } = formData;

    const { dialogCreated } = dialogInfo;
    if (!dialogCreated && active) {
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
        });
    }
  }, [
    dialogInfo, active,
    diffDispatch, formData, investiblesDispatch,
    marketsDispatch, presenceDispatch,
  ]);
  const { marketId, dialogCreated, marketToken } = dialogInfo;
  const marketLink = formMarketLink(marketId);

  if (!active) {
    return React.Fragment;
  }

  return (
    <div>
      {!dialogCreated && (
        <div>
          We're creating your Uclusion Dialog now, please wait a moment.
        </div>

      )}
      {dialogCreated && (
        <div>
          <Typography variant="body1">
            We've created your Dialog, please share the link below.

          </Typography>
          <div className={classes.linkContainer}>
            <InviteLinker
              marketType={DECISION_TYPE}
              marketToken={marketToken}
            />
          </div>
          <div className={classes.borderBottom}></div>
          <StepButtons
            {...props}
            showGoBack={false}
            finishLabel="DialogWizardTakeMeToDialog"
            showStartOver={false}
            onFinish={() => navigate(history, marketLink)}/>
        </div>
      )}
    </div>
  );
}

CreatingDialogStep.propTypes = {
  formData: PropTypes.object,
  active: PropTypes.bool,
};

CreatingDialogStep.defaultProps = {
  formData: {},
  active: false,
};

export default CreatingDialogStep;