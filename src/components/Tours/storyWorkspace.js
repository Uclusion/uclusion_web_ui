
export function inviteStoriesWorkspaceSteps(intl, mobileLayout) {
  const steps = [];
  if (!mobileLayout) {
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
  steps.push({
    disableBeacon: true,
    target: '#adminManageCollaborators',
    placement: 'bottom',
    content: 'Click here to invite your team and avoid another useless retro!',
  })
  return steps;
}