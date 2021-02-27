
export function workspaceInvitedUserSteps (variables) {
  const {
    name,
    id,
  } = variables;
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
      target: `#sl${id}`,
      placement: 'top',
      content: 'Your stories will appear under your name in the swimlanes. Click on them to collaborate, or drag them to change their stage.',
    },
    {
      disableBeacon: true,
      target: '#marketTodos',
      placement: 'top',
      content: 'Bugs or small tasks go in TODOS, and can be assigned to individuals later.',
    },
    {
      disableBeacon: true,
      target: '#notifications',
      placement: 'bottom',
      content: 'Lastly, critical, urgent and, informational notifications will appear up here.',
    },
    
  ];
}