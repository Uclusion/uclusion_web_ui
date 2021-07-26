
export function workspaceInvitedUserSteps (variables) {
  const {
    name
  } = variables;
    const steps = [{
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
      target: '#adminManageCollaborators',
      placement: 'bottom',
      content: 'Use the person add icon to invite other collaborators.',
    }];
    if (document.getElementById('navList')) {
      steps.push({
        disableBeacon: true,
        target: '#navList',
        placement: 'right',
        content: 'Use the navigation sidebar to see the rest of this workspace.',
      });
    }
    if (document.getElementById('yellowLevelNotification')) {
      steps.push({
        disableBeacon: true,
        target: '#yellowLevelNotification',
        placement: 'bottom',
        content: 'Critical, urgent and, informational notifications will appear up here.',
      });
    }
    steps.push({
      disableBeacon: true,
      target: '#helpIcon',
      placement: 'bottom',
      content: "Lastly, this icon takes you to our help guide."
    });
    return steps;
}