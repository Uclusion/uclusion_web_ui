import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { getComment, getCommentRoot } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { useIntl } from 'react-intl';
import JobDescription from '../JobDescription';
import { useHistory } from 'react-router';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';

function DecideResponseStep(props) {
  const { marketId, commentId, message } = props;
  const { decision_investible_id: decisionInvestibleId } = message;
  const history = useHistory();
  const [commentState] = useContext(CommentsContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [marketsState] = useContext(MarketsContext);
  const market = getMarket(marketsState, marketId) || {};
  const { parent_comment_id: parentCommentId, parent_comment_market_id: parentMarketId } = market;
  const optionCommentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const optionComments = (commentState[marketId] || []).filter((comment) =>
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
        {intl.formatMessage({id: 'DecideResponseTitle'})}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        A comment was opened inside an option on this question.
      </Typography>
      <div className={classes.wizardCommentBoxDiv}>
        <CommentBox
          comments={[parentCommentRoot]}
          marketId={parentMarketId}
          allowedTypes={[]}
          isInbox
          removeActions
        />
      </div>
      <div style={{width: '90%', marginLeft: 'auto', marginRight: 'auto',}}>
        <JobDescription marketId={marketId} investibleId={decisionInvestibleId}
                        comments={optionComments}
                        removeActions
                        showAssigned={false}
        />
      </div>
      <WizardStepButtons
        {...props}
        nextLabel="issueReplyLabel"
        isFinal={false}
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

DecideResponseStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideResponseStep;