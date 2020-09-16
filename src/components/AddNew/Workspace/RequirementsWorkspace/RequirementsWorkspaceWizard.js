import React from 'react';
import PropTypes from 'prop-types';
import WorkspaceNameStep from './WorkspaceNameStep';
import FormdataWizard from 'react-formdata-wizard';
import InitialRequirementsStep from './InitialRequirementsStep';
import TodoStep from './TodoStep';
import { WizardStylesProvider } from '../../WizardStylesContext';

function RequirementsWorkspaceWizard (props) {
  const { onStartOver, onFinish } = props;
  return (
    <WizardStylesProvider>
      <FormdataWizard name="requirements_workspace_wizard"
                      onFinish={onFinish}
                      onStartOver={onStartOver}
      >
        <WorkspaceNameStep/>
        <InitialRequirementsStep/>
        <TodoStep/>
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

RequirementsWorkspaceWizard.propTypes = {
  onStartOver: PropTypes.func,
  isHome: PropTypes.bool,
  onFinish: PropTypes.func,
};

RequirementsWorkspaceWizard.defaultProps = {
  onStartOver: () => {},
  isHome: false,
  onFinish: () => {},
};

export default RequirementsWorkspaceWizard;

