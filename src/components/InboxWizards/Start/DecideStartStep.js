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
import { useIntl } from 'react-intl';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { addPlanningInvestible } from '../../../api/investibles';
import { moveComments } from '../../../api/comments';
import { onCommentsMove } from '../../../utils/commentFunctions';
import { addInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { createJobNameFromComments } from '../../../pages/Dialog/Planning/userUtils';

function DecideStartStep(props) {
  const { marketId, commentId, message, updateFormData, formData } = props;
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
  const { useCompression } = formData;

  function myTerminate() {
    removeWorkListItem(message, messagesDispatch, history);
  }

  function onDropTodo() {
      const name = createJobNameFromComments([commentRoot], intl);
      const addInfo = {
        marketId,
        name,
        groupId: commentRoot.group_id,
        stageId: acceptedStage.id,
        assignments: [myPresence.id]
      };
      return addPlanningInvestible(addInfo).then((inv) => {
        const { investible } = inv;
        return moveComments(marketId, investible.id, [commentId])
          .then((movedComments) => {
            onCommentsMove([commentId], messagesState, comments, investible.id, commentsDispatch, marketId,
              movedComments, messagesDispatch);
            addInvestible(invDispatch, () => {}, inv);
            if (setOperationRunning) {
              setOperationRunning(false);
            }
            return investible.id;
          });
      });
  }

  function myAccept() {
    return onDropTodo()
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
      <div className={classes.wizardCommentBoxDiv}>
        <CommentBox
          comments={comments}
          marketId={marketId}
          allowedTypes={[]}
          isInbox
          inboxMessageId={commentId}
          compressAll
          removeActions
          toggleCompression={() => updateFormData({useCompression: !useCompression})}
          useCompression={useCompression}
        />
      </div>
      <WizardStepButtons
        {...props}
        nextLabel="DecideStartBug"
        onNext={myAccept}
        onNextDoAdvance={false}
        showOtherNext
        otherSpinOnClick={false}
        isOtherFinal={false}
        otherNextLabel="otherOptionsLabel"
        terminateLabel="notificationDismiss"
        showTerminate={message.type_object_id.startsWith('UNREAD')}
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