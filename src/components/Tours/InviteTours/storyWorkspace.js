
export function inviteStoriesWorkspaceSteps () {
  return [
    {
      disableBeacon: true,
      target: '#swimLanes',
      placement: 'top',
      content: 'Swimlanes use built-in stages and context based colors to show status at a glance.',
    },
    {
      disableBeacon: true,
      target: '#marketTodos',
      placement: 'right',
      content: 'Workspace TODOs are also color coded and their notifications use the same priority.',
    },
    {
      disableBeacon: true,
      target: '#decisionDialogsBecomeObserver',
      placement: 'left',
      content: 'When you are done with this demonstration Workspace use this button to send it to the archives.',
    }
  ];
}