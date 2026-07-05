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
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { getHumanPresences } from '../../../utils/pokeUtils';
import PokeReminder from '../PokeReminder';

function DecideAssignStep(props) {
  const { marketId, investibleId } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const pokeList = getHumanPresences(marketPresences.filter((presence) =>
    marketInfo.assigned?.includes(presence.id)));
  const intl = useIntl();
  const classes = wizardStyles();

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({ id: 'DecideAssignTitle' })}
      </Typography>
      <PokeReminder pokeList={pokeList}
                    prefix={<>You assigned this job <UsefulRelativeTime
                      value={new Date(marketInfo.last_stage_change_date)}/> and
                      the assignee has not accepted.</>} />
      <JobDescription marketId={marketId} investibleId={investibleId}/>
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        focus
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

export default DecideAssignStep;