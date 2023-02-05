import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { TODO_TYPE } from '../../../constants/comments';
import CommentAdd from '../../Comments/CommentAdd';
import { getPageReducerPage, usePageStateReducer } from '../../PageState/pageStateHooks';
import { formCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';

function BugDescriptionStep (props) {
  const { marketId, groupId } = props;
  const history = useHistory();
  const [commentAddBugStateFull, commentAddBugDispatch] = usePageStateReducer(`addBugWizard${groupId}`);
  const [commentAddBugState, updateCommentAddBugState, commentAddStateBugReset] =
    getPageReducerPage(commentAddBugStateFull, commentAddBugDispatch, groupId);
  const classes = useContext(WizardStylesContext);

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
    <div>
      <Typography className={classes.introText}>
        What has to be fixed?
      </Typography>
      <CommentAdd
        nameKey="CommentAddBlue"
        type={TODO_TYPE}
        wizardProps={{...props, isBug: true}}
        commentAddState={commentAddBugState}
        updateCommentAddState={updateCommentAddBugState}
        commentAddStateReset={commentAddStateBugReset}
        marketId={marketId}
        groupId={groupId}
        onSave={(comment) => navigate(history, formCommentLink(marketId, groupId, undefined, comment.id))}
        nameDifferentiator="addBug"
        isStory={false}
      />
    </div>
    </WizardStepContainer>
  );
}

BugDescriptionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

BugDescriptionStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default BugDescriptionStep;