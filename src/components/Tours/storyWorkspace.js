
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
      target: '#redLevelNotification',
      placement: 'bottom',
      content: 'Immediate TODOs are useful for development bugs. Complete this notification task to automatically clear it.',
    },
    {
      disableBeacon: true,
      target: '#editMarketButtonPlan',
      placement: 'left',
      content: 'When you are done with this demonstration Workspace your can send it to the archives from the configure screen or your home page.',
    }
  ];
}