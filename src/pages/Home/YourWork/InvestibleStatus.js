import React, { useContext } from 'react'
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
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox'
import { REPORT_TYPE } from '../../../constants/comments'
import CommentBox from '../../../containers/CommentBox/CommentBox'
import { getInvestibleComments } from '../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'

function InvestibleStatus(props) {
  const { marketId, investibleId, message } = props;
  const intl = useIntl();
  const workItemClasses = workListStyles();
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentState] = useContext(CommentsContext);
  const marketInvestible = getInvestible(investiblesState, investibleId) || {};
  const marketInfo = getMarketInfo(marketInvestible, marketId) || {};
  const { completion_estimate: daysEstimate } = marketInfo;
  const investibleComments = getInvestibleComments(investibleId, marketId, commentState);
  const progressReports = investibleComments.filter((comment) => comment.comment_type === REPORT_TYPE &&
    !comment.resolved);
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
      <h3>
        {intl.formatMessage({ id: progressReports.length > 0 ? 'orProgressReport' : 'orProgressReportOnly' })}
      </h3>
      {marketId && !_.isEmpty(marketInvestible.investible) && (
        <CommentAddBox
          allowedTypes={[REPORT_TYPE]}
          investible={marketInvestible.investible}
          marketId={marketId}
          issueWarningId={'issueWarningPlanning'}
          isInReview={false}
          isAssignee={true}
          isStory
          numProgressReport={progressReports.length}
        />
      )}
      {progressReports.length > 0 && (
        <div style={{paddingTop: '1rem', overflowY: 'auto', maxHeight: '25rem'}}>
          <CommentBox
            comments={progressReports}
            marketId={marketId}
            allowedTypes={[]}
            isInbox
          />
        </div>
      )}
    </div>
  );
}

export default InvestibleStatus;