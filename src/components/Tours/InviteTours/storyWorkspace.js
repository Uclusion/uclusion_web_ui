
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
      content: 'The critical notification above reminds everyone to assign this immediate TODO or reduce its level.',
    },
    {
      disableBeacon: true,
      target: '#decisionDialogsBecomeObserver',
      placement: 'left',
      content: 'When you are done with this demonstration Workspace use this button to send it to the archives.',
    }
  ];
}