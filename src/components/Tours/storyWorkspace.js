
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
      content: 'Creating an Immediate TODO for a bug or small task sends the critical notification you see in the header.',
    },
    {
      disableBeacon: true,
      target: '#decisionDialogsBecomeObserver',
      placement: 'left',
      content: 'When you are done with this demonstration Workspace use this button to send it to the archives.',
    }
  ];
}