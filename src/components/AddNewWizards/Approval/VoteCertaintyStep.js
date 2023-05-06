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

function VoteCertaintyStep(props) {
  const { market, investibleId, formData, updateFormData, clearFormData, isFor, showSwitch, currentReasonId } = props;
  const [commentsState] = useContext(CommentsContext);
  const history = useHistory();
  const { parent_comment_id: parentCommentId, parent_comment_market_id: parentMarketId } = market;
  const parentComment = getComment(commentsState, parentMarketId, parentCommentId) || {};
  const { investible_id: parentInvestibleId, group_id: parentGroupId } = parentComment;
  const classes = wizardStyles();

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <div>
        <Typography className={classes.introText} variant="h6">
          {showSwitch && (
            'How do you edit voting on this suggestion?'
          )}
          {!showSwitch && (
            `How certain are you of voting ${isFor ? 'for' : 'against'} this suggestion?`
          )}
        </Typography>
        <AddEditVote
          marketId={market.id}
          wizardProps={{...props, finish: () =>
              navigate(history, formCommentLink(parentMarketId, parentGroupId, parentInvestibleId, parentCommentId)),
            onFinish: () =>
              navigate(history, formCommentLink(parentMarketId, parentGroupId, parentInvestibleId, parentCommentId))}}
          investibleId={investibleId}
          currentReasonId={currentReasonId}
          groupId={market.id}
          hasVoted={showSwitch}
          allowMultiVote={false}
          multiplier={isFor ? 1 : -1}
          formData={formData}
          updateFormData={updateFormData}
          clearFormData={clearFormData}
          isInbox={false}
        />
      </div>
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