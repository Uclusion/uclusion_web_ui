import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext'
import DatePicker from 'react-datepicker';
import WizardStepButtons from '../WizardStepButtons';
import { getMidnightToday } from '../../../utils/timerUtils';
import _ from 'lodash';
import { updateInvestible } from '../../../api/investibles';
import { getInvestible, refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { dismissWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { useIntl } from 'react-intl';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { getMarketInfo } from '../../../utils/userFunctions';
import { useHistory } from 'react-router';

function EstimateCompletionStep(props) {
  const { marketId, investibleId, message, updateFormData, formData } = props;
  const classes = wizardStyles();
  const intl = useIntl();
  const history = useHistory();
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const marketInvestible = getInvestible(investiblesState, investibleId) || {};
  const marketInfo = getMarketInfo(marketInvestible, marketId) || {};
  const { completion_estimate: daysEstimate } = marketInfo;
  const { newEstimate } = formData;

  function getDate() {
    if (newEstimate) {
      return new Date(newEstimate);
    }
    if (daysEstimate) {
      const nowDate = new Date();
      if (daysEstimate > nowDate) {
        return daysEstimate;
      }
    }
    return undefined;
  }
  function handleDateChange(rawDate) {
    const date = getMidnightToday(rawDate);
    if (!_.isEqual(date, daysEstimate) && !_.isEqual(date, newEstimate)) {
      updateFormData({ newEstimate: date });
    }
  }
  function submit() {
    if (!_.isEqual(newEstimate, daysEstimate)) {
      const updateInfo = {
        marketId,
        investibleId,
        daysEstimate: newEstimate,
      };
      setOperationRunning(true);
      return updateInvestible(updateInfo).then((fullInvestible) => {
        refreshInvestibles(investiblesDispatch, diffDispatch, [fullInvestible]);
        setOperationRunning(false);
        dismissWorkListItem(message, messagesDispatch, history);
      });
    }
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText} style={{marginBottom: 'unset'}}>
        When is your estimated completion?
      </Typography>
      <div style={{paddingTop: '1rem'}}>
        <DatePicker
          placeholderText={intl.formatMessage({ id: "selectDate" })}
          selected={getDate()}
          onChange={handleDateChange}
          disabled={operationRunning}
          popperPlacement="top"
          minDate={new Date()}
          inline
        />
        <div style={{paddingBottom: '1rem'}} />
        <WizardStepButtons
          {...props}
          nextLabel="StatusWizardDate"
          onNext={submit}
          showTerminate={true}
          terminateLabel="defer"/>
      </div>
    </div>
    </WizardStepContainer>
  );
}

EstimateCompletionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

EstimateCompletionStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default EstimateCompletionStep;