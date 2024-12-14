import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import WizardStepButtons from '../WizardStepButtons';
import { navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { WizardStylesContext } from '../WizardStylesContext';
import { resolveComment } from '../../../api/comments';
import {
  addCommentToMarket,
  getComment,
  getMarketComments
} from '../../../contexts/CommentsContext/commentsContextHelper';
import { removeInlineMarketMessages, removeMessagesForCommentId } from '../../../utils/messageUtils';
import { getInboxTarget } from '../../../contexts/NotificationsContext/notificationsContextHelper';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { TODO_TYPE } from '../../../constants/comments';
import _ from 'lodash';
import { RED_LEVEL } from '../../../constants/notifications';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import Link from '@material-ui/core/Link';

function ArchiveWarningStep(props) {
  const { marketId, commentId, isInbox, formData, updateFormData, typeObjectId } = props;
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const commentToDelete = getComment(commentsState, marketId, commentId);
  const { useCompression } = formData;

  function resolve() {
    return resolveComment(marketId, commentId)
      .then((comment) => {
        const { group_id: groupId, inline_market_id: inlineMarketId } = comment;
        addCommentToMarket(comment, commentsState, commentsDispatch);
        const isTriage = typeObjectId?.startsWith('UNASSIGNED_');
        let criticalCommentsNumber = 0;
        if (isTriage) {
          const marketComments = getMarketComments(commentsState, marketId, groupId);
          criticalCommentsNumber = _.size(marketComments?.filter((comment) => comment.comment_type === TODO_TYPE &&
            !comment.investible_id && comment.notification_type === RED_LEVEL && !comment.resolved));
        }
        removeMessagesForCommentId(commentId, messagesState);
        if (inlineMarketId) {
          removeInlineMarketMessages(inlineMarketId, investiblesState, commentsState, messagesState, messagesDispatch);
        }
        setOperationRunning(false);
        if (isInbox || criticalCommentsNumber === 1) {
          navigate(history, getInboxTarget());
        } else {
          navigate(history);
        }
      });
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        Are you sure you want to resolve?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Resolving a comment that is not in a job moves it to the <Link href="https://documentation.uclusion.com/groups/archive" target="_blank">group's archive</Link>.
      </Typography>
      <CommentBox
        comments={[commentToDelete]}
        marketId={marketId}
        allowedTypes={[]}
        removeActions
        showVoting={false}
        isInbox
        compressAll
        inboxMessageId={commentId}
        toggleCompression={() => updateFormData({ useCompression: !useCompression })}
        useCompression={useCompression}
        displayRepliesAsTop
      />
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        focus
        nextLabel="commentResolveLabel"
        onNext={resolve}
        showTerminate
        onTerminate={() => navigate(history)}
        terminateLabel="OnboardingWizardGoBack"
      />
    </WizardStepContainer>
  );
}

ArchiveWarningStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

ArchiveWarningStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default ArchiveWarningStep;