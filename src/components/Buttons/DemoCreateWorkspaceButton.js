import React, { useContext } from 'react';
import { Button } from '@material-ui/core';
import { navigate } from '../../utils/marketIdPathFunctions';
import { WORKSPACE_WIZARD_TYPE } from '../../constants/markets';
import { wizardStyles } from '../InboxWizards/WizardStylesContext';
import { useHistory } from 'react-router';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { getInboxCount } from '../../contexts/NotificationsContext/notificationsContextHelper';

function DemoCreateWorkspaceButton() {
  const wizardClasses = wizardStyles();
  const history = useHistory();
  const [messagesState] = useContext(NotificationsContext);
  const totalCount = getInboxCount(messagesState, true);

  if (totalCount > 10) {
    return React.Fragment;
  }

  return (
    <Button
      onClick={() => {
        navigate(history, `/wizard#type=${WORKSPACE_WIZARD_TYPE.toLowerCase()}`);
      }}
      className={wizardClasses.actionNext}
      id="workspaceFromDemoBanner"
    >
      Create your workspace
    </Button>
  );
}

export default DemoCreateWorkspaceButton;
