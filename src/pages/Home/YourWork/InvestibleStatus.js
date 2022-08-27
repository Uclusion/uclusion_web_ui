import React, { useContext } from 'react'
import { getTomorrow } from '../../../utils/timerUtils'
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
import { Link } from '@material-ui/core'
import { navigate, preventDefaultAndProp } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { pushMessage } from '../../../utils/MessageBusUtils'
import {
  CURRENT_EVENT,
  MODIFY_NOTIFICATIONS_CHANNEL
} from '../../../contexts/NotificationsContext/notificationsContextMessages'

function InvestibleStatus(props) {
  const { marketId, investibleId, message } = props;
  const { link } = message;
  const history = useHistory();
  const intl = useIntl();
  const workItemClasses = workListStyles();
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const marketInvestible = getInvestible(investiblesState, investibleId) || {};
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
          removeWorkListItem(message, workItemClasses.removed);
        }
        setOperationRunning(false);
      });
    }
  }
  return (
    <div style={{paddingLeft: '5%'}}>
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
      <h3>
        or <Link href={link} onClick={(event) => {
          preventDefaultAndProp(event);
        if (message) {
          pushMessage(MODIFY_NOTIFICATIONS_CHANNEL, { event: CURRENT_EVENT, message });
        }
        navigate(history, link)}}>{intl.formatMessage({id: 'viewInChannelLower'})}</Link> to create or update a progress report
      </h3>
    </div>
  );
}

export default InvestibleStatus;