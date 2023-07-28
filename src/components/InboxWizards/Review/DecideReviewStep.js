import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import JobDescription from '../JobDescription';
import { REPORT_TYPE, TODO_TYPE } from '../../../constants/comments';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { formCommentEditReplyLink, formInvestibleAddCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { getCommentsSortedByType } from '../../../utils/commentFunctions';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { JOB_COMMENT_WIZARD_TYPE } from '../../../constants/markets';
import { useIntl } from 'react-intl';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import _ from 'lodash';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { getFullStage, isNotDoingStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getLabelForTerminate, getShowTerminate } from '../../../utils/messageUtils';

function DecideReviewStep(props) {
  const { marketId, investibleId, message } = props;
  const classes = wizardStyles();
  const history = useHistory();
  const intl = useIntl();
  const [commentsState] = useContext(CommentsContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const inv = getInvestible(investibleState, investibleId) || {};
  const info = getMarketInfo(inv, marketId);
  const { stage: currentStageId } = info || {};
  const fullStage = getFullStage(marketStagesState, marketId, currentStageId) || {};
  const marketComments = getMarketComments(commentsState, marketId);
  const comments = getCommentsSortedByType(marketComments, investibleId, true, true);
  const report = comments.find((comment) => comment.comment_type === REPORT_TYPE);
  // has report should always be true - remove once finalized
  const hasReport = !_.isEmpty(report);
  const createTodo = () => navigate(history,
    formInvestibleAddCommentLink(JOB_COMMENT_WIZARD_TYPE, investibleId, marketId, TODO_TYPE));
  const next = hasReport ? () =>
    navigate(history, formCommentEditReplyLink(marketId, report.id, true), false,
      true) : createTodo;
  const isNotDoing = isNotDoingStage(fullStage);
  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'DecideReviewTitle'})}
      </Typography>
      {isNotDoing && (
        <Typography className={classes.introSubText} variant="subtitle1">
          This job has been moved to Not Doing.
        </Typography>
      )}
      {!isNotDoing && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Review here or click the job title to ask a question or make a suggestion.
        </Typography>
      )}
      <JobDescription marketId={marketId} investibleId={investibleId} comments={comments} removeActions
                      preserveOrder />
      <WizardStepButtons
        {...props}
        nextLabel={hasReport ? 'DecideAddReview' : 'DecideAddTask'}
        onNext={next}
        spinOnClick={false}
        showOtherNext={hasReport && !isNotDoing}
        otherSpinOnClick={false}
        onOtherNext={createTodo}
        otherNextLabel="DecideAddTask"
        terminateLabel={getLabelForTerminate(message)}
        showTerminate={getShowTerminate(message)}
        onFinish={() => removeWorkListItem(message, messagesDispatch, history)}
      />
    </WizardStepContainer>
  );
}

DecideReviewStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideReviewStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideReviewStep;