import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { formCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { FormattedMessage } from 'react-intl';
import { REPLY_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import _ from 'lodash';

function BugDecisionStep (props) {
  const { marketId, comment, comments, updateFormData, formData, typeObjectId } = props;
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const allowedTypes = [];
  if (comment.comment_type === SUGGEST_CHANGE_TYPE) {
    allowedTypes.push('Suggestion');
    allowedTypes.push('Task');
  } else if (comment.comment_type === TODO_TYPE) {
    allowedTypes.push('Task');
    allowedTypes.push('Suggestion');
  } else if (comment.comment_type === REPLY_TYPE) {
    allowedTypes.push('Task');
    allowedTypes.push('Suggestion');
  }
  allowedTypes.push('Bug');
  const { useCompression, useType } = formData;

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText}>
        Move to what?
      </Typography>
      <CommentBox
        comments={comments}
        marketId={marketId}
        allowedTypes={[]}
        isInbox
        compressAll
        inboxMessageId={comment?.id}
        displayRepliesAsTop={comment.comment_type === REPLY_TYPE}
        removeActions
        toggleCompression={() => updateFormData({ useCompression: !useCompression })}
        useCompression={useCompression}
      />
      <div style={{marginBottom: '2rem'}} />
      <FormControl component="fieldset">
        <RadioGroup
          aria-labelledby="type-choice"
          onChange={(event) => {
            const { value } = event.target;
            updateFormData({ useType: value });
          }}
          value={useType || ''}
        >
          {allowedTypes.map((objectType) => {
            return (
              <FormControlLabel
                id={`type${objectType}`}
                key={objectType}
                /* prevent clicking the label stealing focus */
                onMouseDown={e => e.preventDefault()}
                control={<Radio color="primary"/>}
                label={<FormattedMessage id={`${objectType}Label`}/>}
                labelPlacement="end"
                value={objectType}
              />
            );
          })}
        </RadioGroup>
      </FormControl>
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        validForm={!_.isEmpty(useType)}
        isFinal={false}
        onNextSkipStep={useType === 'Bug'}
        spinOnClick={false}
        showTerminate={_.isEmpty(typeObjectId)}
        terminateLabel="OnboardingWizardGoBack"
        onTerminate={() => navigate(history, formCommentLink(marketId, comment.group_id, comment.investible_id,
          comment.id))}
      />
    </WizardStepContainer>
  );
}

BugDecisionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

BugDecisionStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default BugDecisionStep;