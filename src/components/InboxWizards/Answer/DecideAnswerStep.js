import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { getCommentRoot } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { marketAbstain } from '../../../api/markets';
import { changeMyPresence, getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { getLabelForTerminate, getShowTerminate, removeMessagesForCommentId } from '../../../utils/messageUtils';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { useIntl } from 'react-intl';
import JobDescription from '../JobDescription';
import { formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';
import { APPROVAL_WIZARD_TYPE, OPTION_WIZARD_TYPE } from '../../../constants/markets';
import { useHistory } from 'react-router';

function DecideAnswerStep(props) {
  const { marketId, commentId, clearFormData, message } = props;
  const history = useHistory();
  const [commentState] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketPresencesState, presenceDispatch] = useContext(MarketPresencesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [selectedInvestibleId, setSelectedInvestibleId] = useState(undefined);
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const intl = useIntl();
  const presences = getMarketPresences(marketPresencesState, marketId) || [];
  const myPresence = presences.find((presence) => presence.current_user) || {};
  const isQuestionCreator = commentRoot.created_by === myPresence.id;

  function myOnFinish() {
    removeWorkListItem(message, messagesDispatch, history);
  }

  function abstain() {
    return marketAbstain(commentRoot.inline_market_id)
      .then(() => {
        const newValues = {
          abstain: true,
        }
        changeMyPresence(marketPresencesState, presenceDispatch, marketId, newValues)
        removeMessagesForCommentId(commentId, messagesState)
        setOperationRunning(false)
        clearFormData();
      });
  }
  const isRegularFinish = message.type_object_id.startsWith('UNREAD') || message.is_highlighted;
  const noOptions = ['UNREAD_COMMENT', 'ISSUE'].includes(message.type);
  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'DecideAnswerTitle'})}
      </Typography>
      {message.type !== 'UNREAD_COMMENT' && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Answer here or click the question to reply to it, mute this discussion, or add a comment in an option.
        </Typography>
      )}
      {commentRoot.investible_id && (
        <JobDescription marketId={marketId} investibleId={commentRoot.investible_id} comments={comments}
                        removeActions
                        showVoting
                        showDescription={false}
                        showAssigned={false}
                        selectedInvestibleIdParent={selectedInvestibleId}
                        setSelectedInvestibleIdParent={setSelectedInvestibleId} />
      )}
      {!commentRoot.investible_id && (
        <div className={classes.wizardCommentBoxDiv}>
          <CommentBox
            comments={comments}
            marketId={marketId}
            allowedTypes={[]}
            isInbox
            removeActions
            showVoting
            selectedInvestibleIdParent={selectedInvestibleId}
            setSelectedInvestibleIdParent={setSelectedInvestibleId}
          />
        </div>
      )}
      {noOptions && (
        <WizardStepButtons
          {...props}
          nextLabel="issueReplyLabel"
          spinOnClick={false}
          showOtherNext
          otherNextLabel={isQuestionCreator ? 'inlineAddLabel' : 'inlineProposeLabel'}
          otherSpinOnClick={false}
          onOtherNext={() => navigate(history, formWizardLink(OPTION_WIZARD_TYPE, commentRoot.inline_market_id))}
          onOtherNextDoAdvance={false}
          onFinish={myOnFinish}
          showTerminate={getShowTerminate(message)}
          terminateLabel={getLabelForTerminate(message)}
        />
      )}
      {!noOptions && (
        <WizardStepButtons
          {...props}
          nextLabel="DecideWizardApprove"
          spinOnClick={false}
          nextDisabled={!selectedInvestibleId}
          onNext={() => navigate(history, formWizardLink(APPROVAL_WIZARD_TYPE, commentRoot.inline_market_id,
            selectedInvestibleId))}
          onNextDoAdvance={false}
          showOtherNext
          otherNextLabel={isQuestionCreator ? 'inlineAddLabel' : 'inlineProposeLabel'}
          otherSpinOnClick={false}
          onOtherNext={() => navigate(history, formWizardLink(OPTION_WIZARD_TYPE, commentRoot.inline_market_id))}
          onOtherNextDoAdvance={false}
          onFinish={isRegularFinish ? myOnFinish : abstain}
          showTerminate={true}
          terminateSpinOnClick={!isRegularFinish}
          terminateLabel={getLabelForTerminate(message)}
        />
      )}
    </WizardStepContainer>
  );
}

DecideAnswerStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideAnswerStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideAnswerStep;