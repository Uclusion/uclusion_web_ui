import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import ChoicePills from '../../Buttons/ChoicePills';
import _ from 'lodash';
import { useHistory } from 'react-router';
import { goToChosenWizard } from './ComposeWizard';

function ChooseGroupStep (props) {
  const { marketId, groups, updateFormData = () => {}, formData = {} } = props;
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const { useType, groupId } = formData;

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText} style={{marginBottom: '1.5rem'}}>
        Create in which view?
      </Typography>
      <ChoicePills
        ariaLabel="group-choice"
        value={groupId || ''}
        onChange={(value) => updateFormData({ groupId: value })}
        options={groups.map((group) => ({
          value: group.id,
          id: `type${group.id}`,
          label: group.name,
        }))}
      />
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        validForm={!_.isEmpty(groupId)}
        nextLabel="WizardContinue"
        onNext={() => goToChosenWizard(useType, marketId, groupId, history)}
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

export default ChooseGroupStep;