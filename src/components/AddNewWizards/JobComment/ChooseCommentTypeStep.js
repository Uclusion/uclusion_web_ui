import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments';
import { FormattedMessage } from 'react-intl';
import _ from 'lodash';
import JobDescription from '../../InboxWizards/JobDescription';

function ChooseCommentTypeStep (props) {
  const { marketId, investibleId, setUseCommentType, useType } = props;
  const classes = useContext(WizardStylesContext);
  const allowedTypes = [ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE];

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        What type of assistance do you need?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Creating a comment notifies the group.
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
                label={<FormattedMessage id={`${commentType.toLowerCase()}Compose`}/>}
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