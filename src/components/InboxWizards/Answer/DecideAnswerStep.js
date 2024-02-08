import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { getCommentRoot } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { getLabelForTerminate, getShowTerminate } from '../../../utils/messageUtils';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { useIntl } from 'react-intl';
import JobDescription from '../JobDescription';
import { formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';
import { OPTION_WIZARD_TYPE, REPLY_WIZARD_TYPE } from '../../../constants/markets';
import { useHistory } from 'react-router';

function DecideAnswerStep(props) {
  const { marketId, commentId, message, formData, updateFormData } = props;
  const history = useHistory();
  const [commentState] = useContext(CommentsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const intl = useIntl();
  const presences = getMarketPresences(marketPresencesState, marketId) || [];
  const myPresence = presences.find((presence) => presence.current_user) || {};
  const isQuestionCreator = commentRoot.created_by === myPresence.id;
  const { useCompression } = formData;

  function myOnFinish() {
    removeWorkListItem(message, messagesDispatch, history);
  }
  const noOptions = ['UNREAD_COMMENT', 'ISSUE'].includes(message.type);
  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'DecideAnswerTitle'})}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Add your approval to an existing option or propose a new option for the creator of this question.
      </Typography>
      <JobDescription marketId={marketId} investibleId={commentRoot.investible_id} comments={comments}
                      removeActions={noOptions}
                      showVoting
                      useCompression={useCompression}
                      toggleCompression={() => updateFormData({useCompression: !useCompression})} />
      <div style={{marginBottom: '2rem'}}/>
      {noOptions && (
        <WizardStepButtons
          {...props}
          nextLabel="issueReplyLabel"
          onNext={() => navigate(history, formWizardLink(REPLY_WIZARD_TYPE, marketId,
            undefined, undefined, commentId, message.type_object_id))}
          spinOnClick={false}
          showOtherNext
          otherNextLabel={isQuestionCreator ? 'inlineAddLabel' : 'inlineProposeLabel'}
          otherSpinOnClick={false}
          onOtherNext={() => navigate(history, formWizardLink(OPTION_WIZARD_TYPE, commentRoot.inline_market_id,
            undefined, undefined, undefined, message.type_object_id))}
          onFinish={myOnFinish}
          showTerminate={getShowTerminate(message)}
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