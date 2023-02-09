import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormControl, FormControlLabel, Radio, RadioGroup, Tooltip, Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments';
import { FormattedMessage } from 'react-intl';
import _ from 'lodash';

function ChooseCommentTypeStep (props) {
  const { updateFormData, formData } = props;
  const classes = useContext(WizardStylesContext);
  const allowedTypes = [QUESTION_TYPE, SUGGEST_CHANGE_TYPE];
  const { useType } = formData;

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        What kind of discussion do you need?
      </Typography>
      <FormControl component="fieldset">
        <RadioGroup
          aria-labelledby="comment-type-choice"
          onChange={(event) => {
            const { value } = event.target;
            updateFormData({ useType: value });
          }}
          value={useType || ''}
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
        validForm={!_.isEmpty(useType)}
        nextLabel="WizardContinue"
        spinOnClick={false}
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