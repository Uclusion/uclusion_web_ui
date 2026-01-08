import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import JobUnlockStep from './JobUnlockStep';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import JobEditStep from './JobEditStep';
import _ from 'lodash';
import { usePresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import {
  getFullStage,
  isAcceptedStage,
  isInReviewStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';

function JobEditWizard(props) {
  const { marketId, investibleId } = props;
  const [investibleState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [wasUnlocked, setWasUnlocked] = useState(undefined);
  const presences = usePresences(marketId);
  const inv = getInvestible(investibleState, investibleId) || {};
  const { investible } = inv;
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage, assigned} = marketInfo;
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
  const { locked_by: lockedBy } = investible || {};
  const myPresence = presences.find((presence) => presence.current_user);
  const needsLock = !((isInReviewStage(fullStage) || isAcceptedStage(fullStage)) && _.size(assigned) === 1)
    && lockedBy !== myPresence?.id && !_.isEmpty(lockedBy);

  if (_.isEmpty(investible) || _.isEmpty(myPresence)) {
    return React.Fragment;
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`job_edit_wizard${investibleId}`} useLocalStorage={false}>
        {(needsLock || (!_.isEmpty(wasUnlocked) && wasUnlocked === lockedBy)) && (
          <JobUnlockStep marketId={marketId} investible={investible}
                         onFinishUnlock={() => setWasUnlocked(myPresence.id)} />
        )}
        {(_.isEmpty(wasUnlocked) || !needsLock) && (
          <JobEditStep marketId={marketId} investible={investible} />
        )}
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

JobEditWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

export default JobEditWizard;

