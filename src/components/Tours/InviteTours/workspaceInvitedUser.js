
export function workspaceInvitedUserSteps (variables) {
  const {
    name
  } = variables;
    const steps = [{
      disableBeacon: true,
      target: 'body',
      placement: 'center',
      title: `Welcome ${name}!`,
      content: 'Workspaces are where your team collaborates to get things done without meetings.'
    },
    {
      disableBeacon: true,
      target: '#adminManageCollaborators',
      placement: 'bottom',
      content: 'Click here to invite others by magic link or let us send emails for you.',
    }];
    if (document.getElementById('navList')) {
      steps.push({
        disableBeacon: true,
        target: '#navList',
        placement: 'right',
        content: 'The navigation sidebar is a command center for the Workspace.',
      });
    }
    if (document.getElementById('yellowLevelNotification')) {
      steps.push({
        disableBeacon: true,
        target: '#yellowLevelNotification',
        placement: 'bottom',
        content: 'Categorized notifications are automatically sent and appear here so you know what needs to be done when.',
      });
    }
    steps.push({
      disableBeacon: true,
      target: '#helpIcon',
      placement: 'bottom',
      content: "Lastly, documentation on how Uclusion let's you do agile project management without all the meetings."
    });
    return steps;
}