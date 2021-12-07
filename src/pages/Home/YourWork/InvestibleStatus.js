import React, { useContext } from 'react'
import RaisedCard from '../../../components/Cards/RaisedCard'
import { getTomorrow } from '../../../utils/timerUtils'
import DatePicker from 'react-datepicker'
import { useIntl } from 'react-intl'
import _ from 'lodash'
import { updateInvestible } from '../../../api/investibles'
import { getInvestible, refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { getMarketInfo } from '../../../utils/userFunctions'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { removeWorkListItem, workListStyles } from './WorkListItem'

function InvestibleStatus(props) {
  const { marketId, investibleId, message } = props;
  const intl = useIntl();
  const workItemClasses = workListStyles();
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const marketInvestible = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(marketInvestible, marketId) || {};
  const { completion_estimate: daysEstimate } = marketInfo;
  function getStartDate() {
    if (daysEstimate) {
      const nowDate = new Date();
      if (daysEstimate > nowDate) {
        return daysEstimate;
      }
    }
    return undefined;
  }
  function handleDateChange(date) {
    if (!_.isEqual(date, daysEstimate)) {
      const updateInfo = {
        marketId,
        investibleId,
        daysEstimate: date,
      };
      setOperationRunning(true);
      return updateInvestible(updateInfo).then((fullInvestible) => {
        refreshInvestibles(investiblesDispatch, diffDispatch, [fullInvestible]);
        if (message) {
          removeWorkListItem(message, workItemClasses.removed, messagesDispatch);
        }
        setOperationRunning(false);
      });
    }
  }
  return (
    <RaisedCard elevation={3}>
      <div style={{paddingLeft: '3rem'}}>
        <h3>{intl.formatMessage({ id: 'chooseDate' })}</h3>
        <DatePicker
          placeholderText={intl.formatMessage({ id: "selectDate" })}
          selected={getStartDate()}
          onChange={handleDateChange}
          disabled={operationRunning}
          popperPlacement="top"
          minDate={getTomorrow()}
          inline
        />
        <h3>{intl.formatMessage({ id: 'orProgressReport' })}</h3>
      </div>
    </RaisedCard>
  );
}

export default InvestibleStatus;