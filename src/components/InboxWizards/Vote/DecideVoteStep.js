import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { useIntl } from 'react-intl';
import JobDescription from '../JobDescription';

function DecideVoteStep(props) {
  const { marketId, commentRoot, formData, updateFormData } = props;
  const [commentState] = useContext(CommentsContext);
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const intl = useIntl();
  const { useCompression } = formData;

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({ id: 'DecideVoteTitle' })}
      </Typography>
      <JobDescription marketId={marketId} investibleId={commentRoot.investible_id} comments={comments}
                      showVoting
                      useCompression={useCompression}
                      toggleCompression={() => updateFormData({ useCompression: !useCompression })}
      />
    </WizardStepContainer>
  );
}

DecideVoteStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideVoteStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideVoteStep;