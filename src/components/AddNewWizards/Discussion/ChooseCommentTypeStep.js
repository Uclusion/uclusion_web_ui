import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormControl, FormControlLabel, Radio, RadioGroup, Tooltip, Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments';
import { FormattedMessage } from 'react-intl';

function ChooseCommentTypeStep (props) {
  const { investibleId, updateFormData, formData } = props;
  const classes = useContext(WizardStylesContext);
  const allowedTypes = [ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE];
  const { useType } = formData;

  // TODO Drop the popup warning in favor of just warning issueWarningInvestible

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        What type of comment do you need?
      </Typography>
      <FormControl component="fieldset">
        <RadioGroup
          aria-labelledby="comment-type-choice"
          onChange={(event) => {
            const { value } = event.target;
            updateFormData({ useType: value });
          }}
          value={useType || ''}
          row
        >
          {allowedTypes.map((commentType) => {
            return (
              <Tooltip key={`tip${commentType}`}
                       title={<FormattedMessage id={`${commentType.toLowerCase()}Tip`} />}>
                <FormControlLabel
                  id={`commentAddLabel${commentType}`}
                  key={commentType}
                  /* prevent clicking the label stealing focus */
                  onMouseDown={e => e.preventDefault()}
                  control={<Radio color="primary" />}
                  label={<FormattedMessage id={`${commentType.toLowerCase()}Present`} />}
                  labelPlacement="end"
                  value={commentType}
                />
              </Tooltip>
            );
          })}
        </RadioGroup>
      </FormControl>
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        nextLabel="WizardContinue"
        spinOnClick={false}
        otherSpinOnClick={false}
        showTerminate={false}
      />
    </div>
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