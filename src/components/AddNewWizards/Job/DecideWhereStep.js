import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { addMarketComments, getCommentThreads } from '../../../contexts/CommentsContext/commentsContextHelper';
import { addPlanningInvestible } from '../../../api/investibles';
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { formCommentLink, formInvestibleLink } from '../../../utils/marketIdPathFunctions';
import { moveComments } from '../../../api/comments';
import { removeMessagesForCommentId } from '../../../utils/messageUtils';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { useIntl } from 'react-intl';

export function moveCommentsFromIds(inv, comments, fromCommentIds, marketId, groupId, messagesState, updateFormData,
  commentsDispatch) {
  const { investible } = inv;
  const investibleId = investible.id;
  return moveComments(marketId, investibleId, fromCommentIds)
    .then((movedComments) => {
      let threads = []
      fromCommentIds.forEach((commentId) => {
        removeMessagesForCommentId(commentId, messagesState);
        const thread = comments.filter((aComment) => {
          return aComment.root_comment_id === commentId;
        });
        const fixedThread = thread.map((aComment) => {
          return {investible_id: investible.id, ...aComment};
        });
        threads = threads.concat(fixedThread);
      });
      addMarketComments(commentsDispatch, marketId, [...movedComments, ...threads]);
      const link = formCommentLink(marketId, groupId, investibleId, fromCommentIds[0]);
      updateFormData({
        investibleId,
        link,
      });
      return {link};
    });
}

function DecideWhereStep (props) {
  const { marketId, updateFormData, fromCommentIds, marketComments, groupId, isNonBugMove } = props;
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, commentsDispatch] = useContext(CommentsContext);
  const [messagesState] = useContext(NotificationsContext);
  const classes = useContext(WizardStylesContext);
  const intl = useIntl();
  const roots = (fromCommentIds || []).map((fromCommentId) =>
    marketComments.find((comment) => comment.id === fromCommentId) || {id: 'notFound'});
  const comments = getCommentThreads(roots, marketComments);

  function createJob() {
    const name = intl.formatMessage({ id: 'jobFromBugs' });
    // Coming from existing comments usually ready to start - bugs are and voted questions or suggestion should be
    const addInfo = {
      name,
      groupId,
      marketId,
      openForInvestment: true
    }
    return addPlanningInvestible(addInfo)
      .then((inv) => {
        refreshInvestibles(investiblesDispatch, () => {}, [inv]);
        const { id: investibleId } = inv.investible;
        let link = formInvestibleLink(marketId, investibleId);
        // update the form data with the saved investible
        updateFormData({
          investibleId,
          link,
        });
        return moveCommentsFromIds(inv, comments, fromCommentIds, marketId, groupId, messagesState, updateFormData,
          commentsDispatch);
      })
  }

  if (comments.find((comment) => comment.id === 'notFound')) {
    return React.Fragment;
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        Where do you want to move?
      </Typography>
      <div className={classes.wizardCommentBoxDiv}>
        <CommentBox
          comments={comments}
          marketId={marketId}
          allowedTypes={[]}
          isInbox
          isMove
          removeActions
        />
      </div>
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        nextLabel="JobWizardNewJob"
        onNext={isNonBugMove ? undefined : createJob}
        onNextSkipStep
        showOtherNext
        otherNextLabel="JobWizardExistingJob"
        otherSpinOnClick={false}
        showTerminate={false}
      />
    </WizardStepContainer>
  );
}

DecideWhereStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideWhereStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideWhereStep;