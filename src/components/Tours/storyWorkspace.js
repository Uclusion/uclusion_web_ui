
export function inviteStoriesWorkspaceSteps () {
  return [
    {
      disableBeacon: true,
      target: '#redLevelNotification',
      placement: 'bottom',
      content: 'These are critical notification tasks. When a notification task is complete it is cleared for everyone.',
    },
    {
      disableBeacon: true,
      target: '#navList',
      placement: 'right',
      content: 'Use the navigation sidebar to see the rest of this demonstration workspace.',
    },
    {
      disableBeacon: true,
      target: '#editMarketButtonPlan',
      placement: 'left',
      content: 'When you are done send this workspace to the archives from the configure screen or your home page.',
    }
  ];
}