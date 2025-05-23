import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import JobDescription from '../JobDescription';
import { TODO_TYPE } from '../../../constants/comments';
import { getComment, getInvestibleComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { REPLY_WIZARD_TYPE } from '../../../constants/markets';
import { useIntl } from 'react-intl';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { getFullStage, isNotDoingStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getLabelForTerminate, getShowTerminate } from '../../../utils/messageUtils';
import _ from 'lodash';
import { hasReply } from '../../AddNewWizards/Reply/ReplyStep';

function DecideReviewStep(props) {
  const { marketId, report, message, formData, updateFormData } = props;
  const classes = wizardStyles();
  const history = useHistory();
  const intl = useIntl();
  const [commentsState] = useContext(CommentsContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const { investible_id: investibleId, id: commentId } = report;
  const inv = getInvestible(investibleState, investibleId) || {};
  const info = getMarketInfo(inv, marketId);
  const { stage: currentStageId } = info || {};
  const fullStage = getFullStage(marketStagesState, marketId, currentStageId) || {};
  const isNotDoing = isNotDoingStage(fullStage);
  const investibleComments = getInvestibleComments(investibleId, marketId, commentsState);
  const todoComments = investibleComments.filter((comment) => comment.comment_type === TODO_TYPE);
  const reports = investibleComments.filter((comment) =>
    comment.root_comment_id === report.id || comment.id === report.id);
  const comments = _.concat(reports, todoComments);
  const { useCompression } = formData;

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({ id: 'DecideReviewTitle' })}
      </Typography>
      {isNotDoing && (
        <Typography className={classes.introSubText} variant="subtitle1">
          This job has been moved to Not Doing.
        </Typography>
      )}
      {!isNotDoing && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Choose other options to add a task, question, suggestion, or block.
        </Typography>
      )}
      <JobDescription marketId={marketId} investibleId={investibleId} comments={comments} removeActions
                      useCompression={useCompression} inboxMessageId={commentId}
                      toggleCompression={() => updateFormData({ useCompression: !useCompression })}
                      preserveOrder/>
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        focus
        nextLabel="DecideAddReview"
        onNext={() => navigate(history, formWizardLink(REPLY_WIZARD_TYPE, marketId,
          undefined, undefined, commentId, message.type_object_id))}
        onNextDoAdvance={false}
        nextShowEdit={hasReply(getComment(commentsState, marketId, commentId))}
        spinOnClick={false}
        showOtherNext={!isNotDoing}
        otherSpinOnClick={false}
        otherNextLabel="commentInJob"
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