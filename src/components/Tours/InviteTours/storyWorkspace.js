
export function inviteStoriesWorkspaceSteps (variables) {
  const { name } = variables;
  return [
    {
      disableBeacon: true,
      target: '#workspaceMain',
      title: `Welcome ${name}!`,
      placement: 'center',
      content: 'Uclusion Workspaces help you track story progress and decide what to work on next.',
    },
    {
      disableBeacon: true,
      target: '#adminManageCollaborators',
      placement: 'left',
      content: 'You can add others to the workspace with \'Manage collaborators\'.',
    },
    {
      disableBeacon: true,
      target: '#swimLanes',
      placement: 'top',
      content: 'Swimlanes show at a glance what everyone is doing. Click on someone else\'s story in \'Ready to Start\' to approve.',
    },
    {
      disableBeacon: true,
      target: '#addStory',
      placement: 'right',
      content: '\'Create Story\' lets you create a new story and assign.',
    },
    {
      disableBeacon: true,
      target: '#viewArchive',
      placement: 'right',
      content: 'Lastly, \'View Archive\' shows you Dialogs and stories that are complete or are not going to be done.',
    }
  ];
}