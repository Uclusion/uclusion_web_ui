import { isTinyWindow } from '../../../utils/windowUtils'

export function workspaceInvitedUserSteps (variables) {
  const {
    name
  } = variables;
  if (isTinyWindow()) {
    return [{
      disableBeacon: true,
      target: 'body',
      placement: 'center',
      title: `Welcome ${name}!`,
      content: 'Workspaces are where your team collaborates to get things done.'
    },
    {
      disableBeacon: true,
      target: '#workspaceMain',
      placement: 'top',
      content: 'You can edit the workspace description to list user requirements and any other needed information.',
    },
    {
      disableBeacon: true,
      target: '#yellowLevelNotification',
      placement: 'bottom',
      content: 'Lastly, critical, urgent and, informational notifications will appear up here.',
    }];
  }
  return [
    {
      disableBeacon: true,
      target: 'body',
      placement: 'center',
      title: `Welcome ${name}!`,
      content: 'Workspaces are where your team collaborates to get things done.'
    },
    {
      disableBeacon: true,
      target: '#workspaceMain',
      placement: 'top',
      content: 'You can edit the workspace description to list user requirements and any other needed information.',
    },
    {
      disableBeacon: true,
      target: '#navList',
      placement: 'right',
      content: 'Use the navigation sidebar to see the rest of this workspace.',
    },
    {
      disableBeacon: true,
      target: '#yellowLevelNotification',
      placement: 'bottom',
      content: 'Lastly, critical, urgent and, informational notifications will appear up here.',
    }
  ];
}