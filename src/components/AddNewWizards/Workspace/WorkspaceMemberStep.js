import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { ADD_COLLABORATOR_WIZARD_TYPE } from '../../../constants/markets';

function WorkspaceMembersStep(props) {
  const { formData } = props;
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const { marketId: addToMarketId, link } = formData;

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText} variant="h6">
        Invite people to this workspace?
      </Typography>
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        showSkip
        onSkip={() => navigate(history, link)}
        onNext={() => navigate(history,
          `/wizard#type=${ADD_COLLABORATOR_WIZARD_TYPE.toLowerCase()}&marketId=${addToMarketId}`)}
        nextLabel="addMoreCollaborators"
        onNextDoAdvance={false}
        isFinal
      />
    </div>
    </WizardStepContainer>
  );
}

WorkspaceMembersStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

WorkspaceMembersStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default WorkspaceMembersStep;