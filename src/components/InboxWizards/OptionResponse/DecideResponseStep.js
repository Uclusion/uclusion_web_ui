import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { getComment, getCommentRoot, getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { useIntl } from 'react-intl';
import JobDescription from '../JobDescription';
import { useHistory } from 'react-router';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';
import { REPLY_WIZARD_TYPE } from '../../../constants/markets';
import { hasReply } from '../../AddNewWizards/Reply/ReplyStep';

function DecideResponseStep(props) {
  const { marketId, commentId, message, formData = {}, updateFormData = () => {} } = props;
  const { decision_investible_id: decisionInvestibleId } = message;
  const { useCompression } = formData;
  const history = useHistory();
  const [commentState] = useContext(CommentsContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [marketsState] = useContext(MarketsContext);
  const market = getMarket(marketsState, marketId) || {};
  const { parent_comment_id: parentCommentId, parent_comment_market_id: parentMarketId } = market;
  const optionCommentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const optionComments = getMarketComments(commentState, marketId).filter((comment) =>
    comment.root_comment_id === optionCommentRoot.id || comment.id === optionCommentRoot.id);
  const parentCommentRoot = getComment(commentState, parentMarketId, parentCommentId);
  const classes = wizardStyles();
  const intl = useIntl();

  function myOnFinish() {
    removeWorkListItem(message, messagesDispatch, history);
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({ id: 'DecideResponseTitle' })}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        A comment was opened inside an option on this question.
      </Typography>
      {/* B-all-466: the parent question is context, not the payload - show it as
          the one-line compressed card (expandable) and drop the shared 40px
          wizard gap so the option block reads as attached to it.
          B-all-468: the inline market record or the parent comment can be transiently
          missing from state when this wizard renders off a fresh notification, so hold
          the card back until the parent comment loads. */}
      {parentCommentRoot && (
        <div className={classes.wizardCommentBoxDiv} style={{ marginBottom: 0, paddingBottom: '0.5rem' }}>
          <CommentBox
            comments={[parentCommentRoot]}
            marketId={parentMarketId}
            allowedTypes={[]}
            isInbox
            removeActions
            compressAll
            useCompression={useCompression}
            toggleCompression={() => updateFormData({ useCompression: !useCompression })}
          />
        </div>
      )}
      {/* The option and the new comment inside it are one nested block: a left
          border in the question accent color shows the containment, with the
          new comment the only prominent card. */}
      <div style={{ borderLeft: '2px solid #2F80ED', paddingLeft: '1rem', marginLeft: '0.5rem',
        marginTop: '0.5rem' }}>
        <Typography variant="subtitle2" style={{ paddingLeft: '4px' }}>
          {intl.formatMessage({ id: 'inOptionLabel' })}
        </Typography>
        <JobDescription marketId={marketId} investibleId={decisionInvestibleId}
                        comments={optionComments}
                        removeActions
                        showCreatedBy
        />
      </div>
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        focus
        nextLabel="issueReplyLabel"
        onNext={() => navigate(history, formWizardLink(REPLY_WIZARD_TYPE, marketId,
          undefined, undefined, commentId, message.type_object_id))}
        nextShowEdit={hasReply(getComment(commentState, marketId, commentId))}
        spinOnClick={false}
        onFinish={myOnFinish}
        showTerminate={true}
        terminateLabel="notificationDelete"
      />
    </WizardStepContainer>
  );
}

DecideResponseStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default DecideResponseStep;