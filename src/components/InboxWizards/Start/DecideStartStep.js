import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { getComment, getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { useHistory } from 'react-router';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { useIntl } from 'react-intl';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { getNewBugNotifications } from '../../Comments/Options';
import { stripHTML } from '../../../utils/stringFunctions';
import { getMarketInfo } from '../../../utils/userFunctions';
import BugListItem from '../../Comments/BugListItem';
import Comment from '../../Comments/Comment';
import { TODO_TYPE } from '../../CardType';
import { getMarketInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';

function DecideStartStep(props) {
  const { marketId, commentId, message } = props;
  const [commentState] = useContext(CommentsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const intl = useIntl();
  const history = useHistory();
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  const commentRoot = getComment(commentState, marketId, commentId) || {id: 'fake'};
  const comments = getMarketComments(commentState, marketId).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const marketInvestibles = getMarketInvestibles(investiblesState, marketId) || [];
  const activeInvestibles = marketInvestibles.filter((inv) => {
    const marketInfo = getMarketInfo(inv, marketId) || {};
    const { assigned, stage } = marketInfo;
    const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
    return assigned?.includes(myPresence.id) && (fullStage.appears_in_context && fullStage.allows_tasks) ;
  });

  function myTerminate() {
    removeWorkListItem(message, messagesDispatch, history);
  }

  const { id, body, updated_at: updatedAt, notification_type: notificationType, group_id: groupId } = commentRoot;
  const replies = comments.filter(comment => comment.root_comment_id === id) || [];
  const expansionPanel = <div id={`c${id}`} key={`c${id}key`} style={{marginBottom: '1rem'}}>
    <Comment
      marketId={marketId}
      comment={commentRoot}
      comments={comments}
      allowedTypes={[TODO_TYPE]}
      noAuthor
      isInbox
      inboxMessageId={id}
    />
  </div>;

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'DecideStartTitle'})}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Right click the bug for context menu.
      </Typography>
      <BugListItem id={id} key={id} replyNum={replies.length + 1} title={stripHTML(body)}
                newMessages={getNewBugNotifications(commentRoot, messagesState)}
                date={intl.formatDate(updatedAt)} marketId={marketId} groupId={groupId}
                useSelect={false} expansionPanel={expansionPanel} hideRow
                expansionOpen notificationType={notificationType}
                activeInvestibles={activeInvestibles}/>
      <WizardStepButtons
        {...props}
        focus={false}
        showNext={false}
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