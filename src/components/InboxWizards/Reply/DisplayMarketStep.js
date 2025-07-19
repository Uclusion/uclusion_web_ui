import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { useIntl } from 'react-intl';
import JobDescription from '../JobDescription';
import _ from 'lodash';

function DisplayMarketStep(props) {
  const { marketId, commentId, commentRoot, message, formData, updateFormData } = props;
  const [commentState] = useContext(CommentsContext);
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot?.id || comment.id === commentRoot?.id);
  const classes = wizardStyles();
  const intl = useIntl();
  const { useCompression } = formData;
  const { type: messageType, voted_list: votedList } = message;
  const isMention = messageType === 'REPLY_MENTION';
  const hasNewVotes = !_.isEmpty(votedList);

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({ id: isMention ? 'unreadMention' : 'unreadReply' })}
      </Typography>
      {hasNewVotes && (
        <Typography className={classes.introSubText}>
          There are also new votes.
        </Typography>
      )}
      <JobDescription marketId={marketId} investibleId={commentRoot.investible_id} comments={comments}
                      removeActions
                      showVoting
                      inboxMessageId={commentId}
                      useCompression={useCompression}
                      toggleCompression={() => updateFormData({useCompression: !useCompression})} />
    </WizardStepContainer>
  );
}

DisplayMarketStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DisplayMarketStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DisplayMarketStep;