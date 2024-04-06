import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import { FormattedMessage } from 'react-intl';
import _ from 'lodash';
import { formMarketAddCommentLink, formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';
import {
  BUG_WIZARD_TYPE,
  DISCUSSION_WIZARD_TYPE,
  JOB_WIZARD_TYPE
} from '../../../constants/markets';
import { useHistory } from 'react-router';

function ChooseGroupStep (props) {
  const { marketId, groupId, updateFormData, formData } = props;
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const allowedTypes = ['JOB', QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE];
  const { useType } = formData;
  const isFinal = !_.isEmpty(groupId);

  function goToChosenWizard() {
    switch(useType) {
      case 'JOB':
        navigate(history, formWizardLink(JOB_WIZARD_TYPE, marketId, undefined, groupId));
        break;
      case QUESTION_TYPE:
        navigate(history, formMarketAddCommentLink(DISCUSSION_WIZARD_TYPE, marketId, groupId, QUESTION_TYPE));
        break;
      case SUGGEST_CHANGE_TYPE:
        navigate(history, formMarketAddCommentLink(DISCUSSION_WIZARD_TYPE, marketId, groupId, SUGGEST_CHANGE_TYPE));
        break;
      default:
        navigate(history, formMarketAddCommentLink(BUG_WIZARD_TYPE, marketId, groupId, 0));
        break;
    }
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        What do you want to create?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        These are the top level objects in Uclusion.
      </Typography>
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
                  control={<Radio color="primary" />}
                  label={<FormattedMessage id={`${objectType.toLowerCase()}ComposeLabel`} />}
                  labelPlacement="end"
                  value={objectType}
                />
            );
          })}
        </RadioGroup>
      </FormControl>
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        validForm={!_.isEmpty(useType)}
        nextLabel="WizardContinue"
        onNext={isFinal ? goToChosenWizard : undefined}
        isFinal={isFinal}
        spinOnClick={false}
        showTerminate={false}
      />
    </WizardStepContainer>
  );
}

ChooseGroupStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

ChooseGroupStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default ChooseGroupStep;