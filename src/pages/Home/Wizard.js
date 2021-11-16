import React, { useContext } from 'react'
import { useHistory } from 'react-router';
import PropTypes from 'prop-types'
import { useMediaQuery, useTheme } from '@material-ui/core'
import { useIntl } from 'react-intl'
import Screen from '../../containers/Screen/Screen'
import {
  navigate
} from '../../utils/marketIdPathFunctions'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import StoryWorkspaceWizard from '../../components/AddNew/Workspace/StoryWorkspace/StoryWorkspaceWizard'
import DialogWizard from '../../components/AddNew/Dialog/DialogWizard'
import InitiativeWizard from '../../components/AddNew/Initiative/InitiativeWizard'
import WizardSelector from '../../components/AddNew/WizardSelector'

function Wizard(props) {
  const { hidden } = props;
  const history = useHistory();
  const intl = useIntl();
  const theme = useTheme();
  const midLayout = useMediaQuery(theme.breakpoints.down('md'));
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const wizardActive = true;

  function onWizardFinish (formData) {
    const { link } = formData;
    setOperationRunning(false);
    navigate(history, link);
  }
  const noActiveNonSupportMarkets = false;
  return (
    <Screen
      title={intl.formatMessage({ 'id': 'wizardBreadCrumb' })}
      tabTitle={intl.formatMessage({ id: 'wizardBreadCrumb' })}
      hidden={hidden}
    >
      {midLayout && (
        <WizardSelector
          hidden={!wizardActive}
          onFinish={onWizardFinish}
          showCancel={!noActiveNonSupportMarkets}
          onCancel={() => {}}/>
      )}
      {!midLayout && (
        <StoryWorkspaceWizard onStartOver={() => {}}
                              onFinish={onWizardFinish} isHome showCancel={!noActiveNonSupportMarkets}/>
      )}
      {wizardActive && !midLayout && (
        <DialogWizard onStartOver={() => {}} onFinish={onWizardFinish} isHome />
      )}
      {wizardActive && !midLayout && (
        <InitiativeWizard onStartOver={() => {}} onFinish={onWizardFinish} isHome />
      )}
    </Screen>
  );
}

Wizard.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default Wizard;
