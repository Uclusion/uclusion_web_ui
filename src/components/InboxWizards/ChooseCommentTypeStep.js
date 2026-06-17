import React from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from './WizardStepContainer';
import { wizardStyles } from './WizardStylesContext';
import WizardStepButtons from './WizardStepButtons';
import ChoicePills from '../Buttons/ChoicePills';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../constants/comments';
import { FormattedMessage } from 'react-intl';
import _ from 'lodash';
import JobDescription from './JobDescription';
import { formInvestibleAddCommentLink, navigate } from '../../utils/marketIdPathFunctions';
import { JOB_COMMENT_WIZARD_TYPE } from '../../constants/markets';
import { useHistory } from 'react-router';

function ChooseCommentTypeStep (props) {
  const { marketId, investibleId, message, updateFormData = () => {}, formData = {} } = props;
  const classes = wizardStyles();
  const history = useHistory();
  const allowedTypes = [ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE];
  const isReview = ['UNREAD_REVIEWABLE', 'REVIEW_REQUIRED'].includes(message?.type)
    && message?.link_type === 'INVESTIBLE_REVIEW';
  if (isReview) {
    allowedTypes.push(TODO_TYPE);
  }
  const { useType } = formData;
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
      <ChoicePills
        ariaLabel="comment-type-choice"
        value={useType || ''}
        onChange={(value) => updateFormData({ useType: value })}
        options={allowedTypes.map((commentType) => ({
          value: commentType,
          id: `commentAddLabel${commentType}`,
          label: <FormattedMessage id={`${commentType.toLowerCase()}Review`} />,
        }))}
      />
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        validForm={!_.isEmpty(useType)}
        onNext={() => navigate(history,
          formInvestibleAddCommentLink(JOB_COMMENT_WIZARD_TYPE, investibleId, marketId, useType,
            message?.type_object_id))}
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

export default ChooseCommentTypeStep;