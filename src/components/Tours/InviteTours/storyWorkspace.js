
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
      content: 'Swim lanes under each assignee\'s name let you see at a glance what stage a story is at. Click on someone else\'s story in \'Proposed\' to vote whether or not that person should do it.',
    },
    {
      disableBeacon: true,
      target: '#addStory',
      placement: 'right',
      content: '\'Create Story\' lets you create a new story assigned to a member of your team.',
    },
    {
      disableBeacon: true,
      target: '#viewArchive',
      placement: 'right',
      content: 'Lastly, \'View Archive\' shows you the stories that have already been completed, or are not going to be done.',
    }
  ];
}