
export function inviteStoriesWorkspaceSteps(intl) {
  const steps = [];
  if (document.getElementById('navList')) {
    steps.push({
      disableBeacon: true,
      target: `#${intl.formatMessage({ id: 'swimLanes' })}`,
      placement: 'right',
      content: 'The first story beyond failed retros is already assigned to you.',
    });
    steps.push({
      disableBeacon: true,
      target: `#${intl.formatMessage({ id: 'suggestions' })}`,
      placement: 'right',
      content: 'This Suggestion for using Uclusion is waiting for you to add your team so they can vote.',
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
    content: "Documentation on how Uclusion let's you do agile project management without all the meetings."
  });
  steps.push({
    disableBeacon: true,
    target: '#adminManageCollaborators',
    placement: 'bottom',
    content: 'Click here to invite your team and avoid another useless retro!',
  })
  return steps;
}