
export function inviteStoriesWorkspaceSteps(intl) {
  const steps = [
  {
    disableBeacon: true,
    target: '#workspaceMain',
    placement: 'top',
    content: 'We put in video and links to help you get started. Edit and add whatever your team needs to know.',
  }];
  if (document.getElementById('navList')) {
    steps.push({
      disableBeacon: true,
      target: `#${intl.formatMessage({ id: 'swimLanes' })}`,
      placement: 'right',
      content: 'There is a story already assigned to you to send out this Workspace.',
    });
    steps.push({
      disableBeacon: true,
      target: `#${intl.formatMessage({ id: 'suggestions' })}`,
      placement: 'right',
      content: 'Your team will be notified to vote on this Suggestion about using Uclusion.',
    });
  }
  if (document.getElementById('yellowLevelNotification')) {
    steps.push({
      disableBeacon: true,
      target: '#yellowLevelNotification',
      placement: 'bottom',
      content: 'Critical, urgent and, informational notifications appear up here so you know what needs to be done when.',
    });
  }
  steps.push({
    disableBeacon: true,
    target: '#helpIcon',
    placement: 'bottom',
    content: "This takes you to the details of how Uclusion let's you do agile project management without all the meetings."
  });
  steps.push({
    disableBeacon: true,
    target: '#adminManageCollaborators',
    placement: 'bottom',
    content: 'Click here to invite your team and avoid another useless retro!',
  })
  return steps;
}