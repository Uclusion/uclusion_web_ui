import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import { FormattedMessage } from 'react-intl';
import _ from 'lodash';
import JobDescription from '../../InboxWizards/JobDescription';
import { findMessagesForTypeObjectId } from '../../../utils/messageUtils';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';

function ChooseCommentTypeStep (props) {
  const { marketId, investibleId, setUseCommentType, useType, typeObjectId } = props;
  const [messagesState] = useContext(NotificationsContext);
  const classes = useContext(WizardStylesContext);
  const allowedTypes = [ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE];
  const message = findMessagesForTypeObjectId(typeObjectId, messagesState);
  const isReview = ['UNREAD_REVIEWABLE', 'REVIEW_REQUIRED'].includes(message?.type)
    && message?.link_type === 'INVESTIBLE_REVIEW';
  if (isReview) {
    allowedTypes.push(TODO_TYPE);
  }
  return (
    <WizardStepContainer
      isLarge
      {...props}
    >
      <Typography className={classes.introText}>
        {isReview ? 'What do you need for your review?' :'What type of assistance do you need?'}
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId}/>
      <div className={classes.borderBottom}/>
      <FormControl component="fieldset">
        <RadioGroup
          aria-labelledby="comment-type-choice"
          onChange={(event) => {
            const { value } = event.target;
            setUseCommentType(value);
          }}
          value={useType || ''}
        >
          {allowedTypes.map((commentType) => {
            return (
              <FormControlLabel
                id={`commentAddLabel${commentType}`}
                key={commentType}
                /* prevent clicking the label stealing focus */
                onMouseDown={e => e.preventDefault()}
                control={<Radio color="primary"/>}
                label={<FormattedMessage id={`${commentType.toLowerCase()}Review`}/>}
                labelPlacement="end"
                value={commentType}
              />
            );
          })}
        </RadioGroup>
      </FormControl>
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        validForm={!_.isEmpty(useType)}
        nextLabel="WizardContinue"
        isFinal={false}
        spinOnClick={false}
        showTerminate={false}
      />
    </WizardStepContainer>
  );
}

ChooseCommentTypeStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

ChooseCommentTypeStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default ChooseCommentTypeStep;