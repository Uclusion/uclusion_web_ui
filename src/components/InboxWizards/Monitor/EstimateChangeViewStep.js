import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import JobDescription from '../JobDescription';
import { getCommentsSortedByType } from '../../../utils/commentFunctions';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { useIntl } from 'react-intl';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { useHistory } from 'react-router';
import { formInvestibleAddCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { JOB_COMMENT_WIZARD_TYPE } from '../../../constants/markets';
import { ISSUE_TYPE, QUESTION_TYPE } from '../../../constants/comments';

function EstimateChangeViewStep(props) {
  const { marketId, investibleId, message } = props;
  const intl = useIntl();
  const history = useHistory();
  const classes = wizardStyles();
  const [commentsState] = useContext(CommentsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const marketInvestible = getInvestible(investiblesState, investibleId) || {};
  const marketInfo = getMarketInfo(marketInvestible, marketId) || {};
  const marketComments = getMarketComments(commentsState, marketId, marketInfo.group_id);
  const comments = getCommentsSortedByType(marketComments, investibleId, true, true);
  const { completion_estimate: daysEstimate } = marketInfo;

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText} style={{marginBottom: 'unset'}}>
        {intl.formatMessage({id: 'unreadEstimate'})}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Estimate changed from {message.text ? intl.formatDate(new Date(message.text)) : 'none'} to {intl.formatDate(daysEstimate)}.
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} comments={comments} removeActions />
      <WizardStepButtons
        {...props}
        nextLabel="createNewQUESTION"
        onNext={() => navigate(history,
          formInvestibleAddCommentLink(JOB_COMMENT_WIZARD_TYPE, investibleId, marketId, QUESTION_TYPE))}
        spinOnClick={false}
        showOtherNext
        otherNextLabel="createNewISSUE"
        onOtherNext={() => navigate(history,
          formInvestibleAddCommentLink(JOB_COMMENT_WIZARD_TYPE, investibleId, marketId, ISSUE_TYPE))}
        otherSpinOnClick={false}
        onFinish={() => removeWorkListItem(message, messagesDispatch, history)}
        terminateLabel="notificationDelete"
        showTerminate={true}
      />
    </WizardStepContainer>
  );
}

EstimateChangeViewStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

EstimateChangeViewStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default EstimateChangeViewStep;