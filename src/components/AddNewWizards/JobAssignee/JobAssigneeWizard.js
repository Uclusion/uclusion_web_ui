import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import JobAssignStep from './JobAssignStep';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import JobApproveStep from './JobApproveStep';

function JobAssigneeWizard(props) {
  const { marketId, investibleId } = props;
  const [investibleState] = useContext(InvestiblesContext);
  const inv = getInvestible(investibleState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`job_assignee_wizard${investibleId}`} useLocalStorage={false}>
        <JobAssignStep marketId={marketId} investibleId={investibleId} marketInfo={marketInfo} />
        <JobApproveStep marketId={marketId} investibleId={investibleId} marketInfo={marketInfo} />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

JobAssigneeWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

export default JobAssigneeWizard;

