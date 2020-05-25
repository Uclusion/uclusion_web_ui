export const INVITE_WORKSPACE_FAMILY_NAME = 'INVITE_WORKSPACE';
export const INVITE_WORKSPACE_FIRST_VIEW = 'invite_workspace_first_view';

export const INVITE_WORKSPACE_SEQUENCE = [
  INVITE_WORKSPACE_FIRST_VIEW,
];

export function inviteWorkspaceSteps(variables) {
  const { name } = variables;
  return [
    {
      disableBeacon: true,
      target: '#workspaceMain',
      title: `Welcome ${name}!`,
      content: 'Uclusion Workspaces let you and your collaborators track story progress and decide what to work on next.',
    },
    {
      disableBeacon: true,
      target: '#swimLanes',
      content: 'Swim lanes under each person\'s name let you see at a glance what stage a story is in, and clicking on a story lets you vote for it or change it\'s stage',
    },
    {
      disableBeacon: true,
      target: '#addStory',
      content: 'You can assign a new story to someone with \'Create Story\'',
    },
    {
      disableBeacon: true,
      target: '#viewArchive',
      content: 'View Archive shows you the stories that have already been completed, or are not going to be done.',
    },
    {
      disableBeacon: true,
      target: '#commentAddArea',
      content: 'Lastly, structured discussion happens down here.',
    }
  ]
}