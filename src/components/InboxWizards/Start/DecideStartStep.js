import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { getComment } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { getStages, isAcceptedStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { useHistory } from 'react-router';
import { wizardFinish } from '../InboxWizardUtils';
import { formInvestibleLink } from '../../../utils/marketIdPathFunctions';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { onDropTodo } from '../../../pages/Dialog/Planning/userUtils';
import { useIntl } from 'react-intl';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';

function DecideStartStep(props) {
  const { marketId, commentId, message } = props;
  const [commentState, commentsDispatch] = useContext(CommentsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [, invDispatch] = useContext(InvestiblesContext)
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const intl = useIntl();
  const history = useHistory();
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  const commentRoot = getComment(commentState, marketId, commentId) || {id: 'fake'};
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const marketStages = getStages(marketStagesState, marketId) || [];
  const acceptedStage = marketStages.find(stage => isAcceptedStage(stage)) || {};

  function myTerminate() {
    removeWorkListItem(message, messagesDispatch, history);
  }

  function myAccept() {
    onDropTodo(commentId, commentState, marketId, undefined, intl, commentsDispatch, invDispatch,
      myPresence.id, acceptedStage.id, 'jobFromBugs', messagesState, messagesDispatch)
      .then((investibleId) => {
        wizardFinish( { link: `${formInvestibleLink(marketId, investibleId)}#start` }, setOperationRunning,
          message, history, marketId, investibleId, messagesDispatch);
      });
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'DecideStartTitle'})}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Take action here or click the bug to resolve or reply.
      </Typography>
      <div className={classes.wizardCommentBoxDiv}>
        <CommentBox
          comments={comments}
          marketId={marketId}
          allowedTypes={[]}
          isInbox
          removeActions
        />
      </div>
      <WizardStepButtons
        {...props}
        nextLabel="DecideStartBug"
        onNext={myAccept}
        isFinal={false}
        onNextDoAdvance={false}
        showOtherNext
        otherSpinOnClick={false}
        otherNextLabel="DecideStartBugExisting"
        terminateLabel={ message.type_object_id.startsWith('UNREAD') ? 'notificationDismiss' : 'defer' }
        showTerminate={message.type_object_id.startsWith('UNREAD') || message.is_highlighted}
        onFinish={myTerminate}
      />
    </WizardStepContainer>
  );
}

DecideStartStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideStartStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideStartStep;