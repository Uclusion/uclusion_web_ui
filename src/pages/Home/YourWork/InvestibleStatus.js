import React, { useContext } from 'react'
import DatePicker from 'react-datepicker'
import { useIntl } from 'react-intl'
import _ from 'lodash'
import { updateInvestible } from '../../../api/investibles'
import { getInvestible, refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { getMarketInfo } from '../../../utils/userFunctions'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { removeWorkListItem, workListStyles } from './WorkListItem'
import WizardStepButtons from '../../../components/InboxWizards/WizardStepButtons'
import { formInvestibleLink } from '../../../utils/marketIdPathFunctions'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { getMidnightToday } from '../../../utils/timerUtils';

function InvestibleStatus(props) {
  const { marketId, investibleId, message, wizardProps } = props;
  const { updateFormData, formData, clearFormData } = wizardProps;
  const intl = useIntl();
  const workItemClasses = workListStyles();
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
        if (message) {
          removeWorkListItem(message, workItemClasses.removed, messagesDispatch);
        }
        setOperationRunning(false);
        clearFormData();
        return { link: formInvestibleLink(marketId, investibleId) };
      });
    }
  }
  return (
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
        {...wizardProps}
        nextLabel="StatusWizardDate"
        onNext={submit}
        showTerminate={true}
        terminateLabel="defer"/>
    </div>
  );
}

export default InvestibleStatus;