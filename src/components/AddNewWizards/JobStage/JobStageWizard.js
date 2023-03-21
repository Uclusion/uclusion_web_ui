import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import JobStageStep from './JobStageStep';
import JobAssignStep from './JobAssignStep';
import CloseCommentsStep from './CloseCommentsStep';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import _ from 'lodash';
import { isNotDoingStage, isVerifiedStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { formInvestibleLink, formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';

function JobStageWizard(props) {
  const { marketId, investibleId } = props;
  const history = useHistory();
  const [investibleState] = useContext(InvestiblesContext);
  const inv = getInvestible(investibleState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage, assigned, group_id: groupId } = marketInfo;

  if (_.isEmpty(stage)) {
    return React.Fragment;
  }

  function finish(fullMoveStage) {
    if (fullMoveStage && (isNotDoingStage(fullMoveStage)||isVerifiedStage(fullMoveStage))) {
      navigate(history, formMarketLink(marketId, groupId));
    } else {
      navigate(history, formInvestibleLink(marketId, investibleId));
    }
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`job_stage_wizard${investibleId}`} useLocalStorage={false}>
        <JobStageStep myFinish={finish} marketId={marketId} investibleId={investibleId} marketInfo={marketInfo} />
        {_.isEmpty(assigned) && (
          <JobAssignStep myFinish={finish} marketId={marketId} investibleId={investibleId} marketInfo={marketInfo} />
        )}
        <CloseCommentsStep myFinish={finish} marketId={marketId} investibleId={investibleId} marketInfo={marketInfo} />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

JobStageWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

JobStageWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default JobStageWizard;

