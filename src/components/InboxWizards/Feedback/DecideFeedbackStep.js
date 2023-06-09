import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { getCommentRoot, getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import JobDescription from '../JobDescription';
import { useIntl } from 'react-intl';
import { formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';
import { JOB_STAGE_WIZARD_TYPE } from '../../../constants/markets';
import { useHistory } from 'react-router';
import Voting from '../../../pages/Investible/Decision/Voting';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { JUSTIFY_TYPE } from '../../../constants/comments';

function DecideFeedbackStep(props) {
  const { marketId, commentId, message } = props;
  const intl = useIntl();
  const history = useHistory();
  const [commentState] = useContext(CommentsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [marketsState] = useContext(MarketsContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const market = getMarket(marketsState, marketId) || {};
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const marketComments = getMarketComments(commentState, marketId);
  const investmentReasons = marketComments.filter((comment) => {
    return comment.comment_type === JUSTIFY_TYPE && comment.investible_id === message.investible_id;
  });
  const comments = marketComments.filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const isNewVote = message.type === 'UNREAD_VOTE';

  function myOnFinish() {
    removeWorkListItem(message, messagesDispatch, history);
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        {intl.formatMessage({id: isNewVote ? 'startJobQ' : 'DecideFeedbackTitle'})}
      </Typography>
      <JobDescription marketId={marketId} investibleId={commentRoot.investible_id || message.investible_id}
                      comments={comments} removeActions />
      {isNewVote && (
        <Voting
          investibleId={message.investible_id}
          marketPresences={marketPresences}
          investmentReasons={investmentReasons}
          showExpiration={true}
          expirationMinutes={market.investment_expiration * 1440}
          votingAllowed={false}
          yourPresence={marketPresences.find((presence) => presence.current_user)}
          market={market}
          isInbox
          isAssigned={true}
        />
      )}
      <WizardStepButtons
        {...props}
        onFinish={myOnFinish}
        nextLabel="changeStage"
        spinOnClick={false}
        onNext={() => navigate(history, formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId,
          commentRoot.investible_id))}
        showOtherNext={!isNewVote}
        otherNextLabel="issueReplyLabel"
        otherSpinOnClick={false}
        showTerminate={message.type_object_id.startsWith('UNREAD') || message.is_highlighted}
        terminateLabel={message.type_object_id.startsWith('UNREAD') ? 'notificationDelete' : 'defer'}
      />
    </div>
    </WizardStepContainer>
  );
}

DecideFeedbackStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideFeedbackStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideFeedbackStep;