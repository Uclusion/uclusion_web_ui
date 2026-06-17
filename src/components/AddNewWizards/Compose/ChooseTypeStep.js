import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import ChoicePills from '../../Buttons/ChoicePills';
import { QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import { useHistory } from 'react-router';
import { goToChosenWizard } from './ComposeWizard';

function ChooseTypeStep (props) {
  const { marketId, groupId, updateFormData = () => {}, formData = {} } = props;
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const intl = useIntl();
  const allowedTypes = ['JOB', QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE, 'GROUP', 'WORKSPACE'];
  const { useType } = formData;
  const isFinal = !_.isEmpty(groupId) || ['WORKSPACE', 'GROUP'].includes(useType) ;

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        What do you want to create?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        These are the top level types.
      </Typography>
      <ChoicePills
        ariaLabel="type-choice"
        vertical
        value={useType || ''}
        onChange={(value) => updateFormData({ useType: value })}
        options={allowedTypes.map((objectType) => {
          // Label is "Name - description"; show the name in the pill and the
          // rest as inline text after it (C-all-977).
          const full = intl.formatMessage({ id: `${objectType}ComposeLabel` });
          const sep = full.indexOf(' - ');
          return {
            value: objectType,
            id: `type${objectType}`,
            label: sep >= 0 ? full.slice(0, sep) : full,
            description: sep >= 0 ? full.slice(sep) : undefined,
          };
        })}
      />
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        validForm={!_.isEmpty(useType)}
        nextLabel="WizardContinue"
        onNext={isFinal ? () => goToChosenWizard(useType, marketId, groupId, history) : undefined}
        isFinal={isFinal}
        onNextDoAdvance={!isFinal}
        spinOnClick={false}
        showTerminate={false}
      />
    </WizardStepContainer>
  );
}

ChooseTypeStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default ChooseTypeStep;