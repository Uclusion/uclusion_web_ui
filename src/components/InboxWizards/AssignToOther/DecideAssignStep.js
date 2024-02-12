import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import JobDescription from '../JobDescription';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import UsefulRelativeTime from '../../TextFields/UseRelativeTime';
import { getMarketInfo } from '../../../utils/userFunctions';
import { useIntl } from 'react-intl';
import { pokeInvestible } from '../../../api/users';
import Link from '@material-ui/core/Link';

function DecideAssignStep(props) {
  const { marketId, investibleId } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const intl = useIntl();
  const classes = wizardStyles();

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'DecideAssignTitle'})}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        You assigned this job <UsefulRelativeTime value={new Date(marketInfo.last_stage_change_date)}/> and
        the assignee has not accepted. Poke to resend notifications and
        message <Link href="https://documentation.uclusion.com/notifications" target="_blank">configured channels</Link>.
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} />
      <WizardStepButtons
        {...props}
        nextLabel="DecideJobOwner"
        spinOnClick={false}
        isFinal={false}
        showTerminate
        terminateLabel="poke"
        terminateSpinOnClick
        onFinish={() => pokeInvestible(marketId, investibleId).then(() => {
          setOperationRunning(false);
        })}
      />
    </WizardStepContainer>
  );
}

DecideAssignStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideAssignStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideAssignStep;