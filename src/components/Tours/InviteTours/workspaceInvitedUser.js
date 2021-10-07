
export function workspaceInvitedUserSteps (variables) {
  const {
    name,
    isCreator
  } = variables;
    const steps = [];
    if (isCreator) {
      steps.push({
        disableBeacon: true,
        target: '#emailInput',
        placement: 'bottom',
        content: 'Add collaborators here to let us send emails for you.',
      });
    } else {
      steps.push({
        disableBeacon: true,
        target: 'body',
        placement: 'center',
        title: `Welcome ${name}!`,
        content: 'Workspaces are where your team collaborates to get things done without meetings.'
      });
    }
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