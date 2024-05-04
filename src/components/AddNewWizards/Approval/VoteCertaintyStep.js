import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import AddEditVote from '../../../pages/Investible/Voting/AddEditVote';
import { getComment } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { formCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import CommentBox from '../../../containers/CommentBox/CommentBox';

function VoteCertaintyStep(props) {
  const { market, investibleId, formData, updateFormData, isFor, showSwitch, currentReasonId, wasDeleted } = props;
  const [commentsState] = useContext(CommentsContext);
  const history = useHistory();
  const { parent_comment_id: parentCommentId, parent_comment_market_id: parentMarketId } = market;
  const parentComment = getComment(commentsState, parentMarketId, parentCommentId) || {};
  const { investible_id: parentInvestibleId, group_id: parentGroupId } = parentComment;
  const classes = wizardStyles();
  const { useCompression } = formData;

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
        {!showSwitch && (
          <Typography className={classes.introText} variant="h6">
            How certain are you of voting <i>{isFor ? 'for' : 'against'}</i> this suggestion?
          </Typography>
        )}
        {showSwitch && (
          <Typography className={classes.introText} variant="h6">
            How do you edit voting on this suggestion?
          </Typography>
        )}
        <CommentBox
          comments={[parentComment]}
          marketId={parentMarketId}
          allowedTypes={[]}
          removeActions
          showVoting={false}
          isInbox
          inboxMessageId={parentComment?.id}
          toggleCompression={() => updateFormData({useCompression: !useCompression})}
          useCompression={useCompression}
        />
        <AddEditVote
          marketId={market.id}
          wizardProps={{...props, finish: () =>
              navigate(history, formCommentLink(parentMarketId, parentGroupId, parentInvestibleId, parentCommentId)),
            }}
          investibleId={investibleId}
          currentReasonId={currentReasonId}
          groupId={market.id}
          hasVoted={showSwitch}
          allowMultiVote={false}
          multiplier={isFor ? 1 : -1}
          formData={formData}
          updateFormData={updateFormData}
          wasDeleted={wasDeleted}
          isInbox={false}
        />
    </WizardStepContainer>
  )
}

VoteCertaintyStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

VoteCertaintyStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default VoteCertaintyStep