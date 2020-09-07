import React from 'react'
import PropTypes from 'prop-types'
import WorkspaceNameStep from './WorkspaceNameStep'
import CreationWizard from '../../CreationWizard'
import { useIntl } from 'react-intl'
import InitialRequirementsStep from './InitialRequirementsStep'
import TodoStep from './TodoStep'

function RequirementsWorkspaceWizard (props) {
  const { hidden, onStartOver, isHome, onFinish } = props;
  const intl = useIntl();

  const stepPrototypes = [
    {
      label: 'ReqWorkspaceWizardNameStepLabel',
      content: <WorkspaceNameStep />,
    },
    {
      label: 'ReqWorkspaceWizardRequirementsStepLabel',
      content: <InitialRequirementsStep/>,
    },
    {
      label: 'ReqWorkspaceWizardTodoStepLabel',
      content: <TodoStep/>,
    },

  ];

  return (
    <CreationWizard
      title={intl.formatMessage({ id: 'WorkspaceWizardTitle' })}
      hidden={hidden}
      isHome={isHome}
      onFinish={onFinish}
      onStartOver={onStartOver}
      stepPrototypes={stepPrototypes}
    />
  );
}

RequirementsWorkspaceWizard.propTypes = {
  hidden: PropTypes.bool.isRequired,
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

