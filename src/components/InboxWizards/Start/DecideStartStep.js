import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox'
import { getComment } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { getStages, isAcceptedStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { useHistory } from 'react-router'
import { wizardFinish } from '../InboxWizardUtils'
import {
  formCommentLink,
  formInvestibleLink,
  navigate
} from '../../../utils/marketIdPathFunctions'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { onDropTodo } from '../../../pages/Dialog/Planning/userUtils'
import { useIntl } from 'react-intl'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { removeWorkListItem, workListStyles } from '../../../pages/Home/YourWork/WorkListItem'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';


function DecideStartStep(props) {
  const { marketId, commentId, clearFormData, message } = props;
  const [commentState, commentsDispatch] = useContext(CommentsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [, invDispatch] = useContext(InvestiblesContext)
  const [, messagesDispatch] = useContext(NotificationsContext);
  const intl = useIntl();
  const history = useHistory();
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  const commentRoot = getComment(commentState, marketId, commentId) || {id: 'fake'};
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const workItemClasses = workListStyles();
  const marketStages = getStages(marketStagesState, marketId) || [];
  const acceptedStage = marketStages.find(stage => isAcceptedStage(stage)) || {};

  function goToComment() {
    navigate(history, formCommentLink(marketId, commentRoot.group_id, commentRoot.investible_id, commentId));
  }

  function myTerminate() {
    if (message.is_highlighted) {
      removeWorkListItem(message, workItemClasses.removed, messagesDispatch);
    } else {
      goToComment();
    }
  }

  function myAccept() {
    onDropTodo(commentId, commentState, marketId, undefined, intl, commentsDispatch, invDispatch,
      myPresence.id, acceptedStage.id)
      .then((investibleId) => {
        clearFormData();
        wizardFinish( { link: formInvestibleLink(marketId, investibleId) }, setOperationRunning, message,
          history, marketId, investibleId, messagesDispatch);
      });
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'DecideStartTitle'})}
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
        showOtherNext={message.is_highlighted}
        otherNextLabel="DecideStartNavigate"
        onOtherNext={goToComment}
        otherSpinOnClick={false}
        terminateLabel={ message.type_object_id.startsWith('UNREAD') ? 'notificationDismiss'
          : (message.is_highlighted ? 'markRead' : 'DecideStartTerminate' ) }
        showTerminate={true}
        onFinish={myTerminate}
      />
    </div>
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