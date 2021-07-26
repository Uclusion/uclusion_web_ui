
export function inviteStoriesWorkspaceSteps (variables, intl) {
  const {
    name
  } = variables;
  const steps = [{
    disableBeacon: true,
    target: 'body',
    placement: 'center',
    title: `Welcome ${name}!`,
    content: 'We created this Workspace to help with continuous improvement.'
  },
  {
    disableBeacon: true,
    target: '#workspaceMain',
    placement: 'top',
    content: 'The Workspace description has a video and links with more information.',
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
      target: `#${intl.formatMessage({ id: 'swimLanes' })}`,
      placement: 'right',
      content: 'Use the navigation sidebar to see the story assigned to you.',
    });
    steps.push({
      disableBeacon: true,
      target: `#${intl.formatMessage({ id: 'suggestions' })}`,
      placement: 'right',
      content: 'Also check out the suggestion we created for you.',
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