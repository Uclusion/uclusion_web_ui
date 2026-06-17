import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import ChoicePills from '../../Buttons/ChoicePills';
import { WizardStylesContext } from '../WizardStylesContext';
import { formCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { FormattedMessage } from 'react-intl';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import WizardStepButtons from '../WizardStepButtons';
import {
  addCommentToMarket,
  addMarketComments,
  getMarketComments
} from '../../../contexts/CommentsContext/commentsContextHelper';
import { alterComment } from '../../../api/comments';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import _ from 'lodash';

function TaskToBugStep (props) {
  const { marketId, comment, comments, updateFormData = () => {}, formData = {} } = props;
  const [commentsState, commentDispatch] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const { newQuantity, useCompression } = formData;

  function onChange(event) {
    updateFormData({
      newQuantity: event.target.value
    });
  }

  function handleSave() {
    return alterComment(marketId, comment.id, newQuantity)
      .then((response) => {
        addCommentToMarket(response, commentsState, commentDispatch);
        const marketComments = getMarketComments(commentsState, marketId, comment.group_id);
        const thread = marketComments.filter((aComment) => {
          return aComment.root_comment_id === comment.id;
        });
        const fixedThread = thread.map((aComment) => {
          return _.omit(aComment, 'investible_id');
        });
        addMarketComments(commentDispatch, marketId, [...fixedThread]);
        setOperationRunning(false);
        navigate(history, formCommentLink(marketId, comment.group_id, undefined, comment.id));
      });
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText}>
        What level is this bug?
      </Typography>
      <ChoicePills
        ariaLabel="add-vote-certainty"
        value={newQuantity || ''}
        onChange={(value) => onChange({ target: { value } })}
        options={['RED', 'YELLOW', 'BLUE'].map((certainty) => ({
          value: certainty,
          id: `${certainty}`,
          label: <FormattedMessage id={`notificationLabel${certainty}`} />,
        }))}
      />
      <div className={classes.wizardCommentBoxDiv}>
        <CommentBox
          comments={comments}
          marketId={marketId}
          allowedTypes={[]}
          isInbox
          compressAll
          inboxMessageId={comment?.id}
          removeActions
          toggleCompression={() => updateFormData({useCompression: !useCompression})}
          useCompression={useCompression}
        />
      </div>
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        validForm={!_.isEmpty(newQuantity)}
        nextLabel="createBug"
        onNext={handleSave}
        showTerminate
        terminateLabel="OnboardingWizardGoBack"
        onTerminate={() => navigate(history, formCommentLink(marketId, comment.group_id, comment.investible_id,
          comment.id))}
      />
    </WizardStepContainer>
  );
}

TaskToBugStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default TaskToBugStep;