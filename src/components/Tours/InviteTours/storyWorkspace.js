export const INVITE_STORIES_WORKSPACE_FAMILY_NAME = 'INVITE_STORIES_WORKSPACE';
export const INVITE_STORIES_WORKSPACE_FIRST_VIEW = 'invite_stories_workspace_first_view';


export function inviteStoriesWorkspaceSteps(variables) {
  const { name } = variables;
  return [
    {
      disableBeacon: true,
      target: '#workspaceMain',
      title: `Welcome ${name}!`,
      content: 'Uclusion Workspaces help you track story progress and decide what to work on next.',
    },
    {
      disableBeacon: true,
      target: '#swimLanes',
      content: 'Swim lanes under each assignee\'s name let you see at a glance what stage a story is at. Stories in \'Proposed\' should be voted for before they move to \'In Progress\'.',
    },

    {
      disableBeacon: true,
      target: '#addStory',
      content: '\'Create Story\' lets you create a new story assigned to a member of your team.',
    },
    {
      disableBeacon: true,
      target: '#viewArchive',
      content: '\'View Archive\' shows you the stories that have already been completed, or are not going to be done.',
    },
    {
      disableBeacon: true,
      target: '#commentAddArea',
      content: 'Lastly, down here, Uclusion provides structure to communication. When you start a conversation, we\'ll handle notifying the right people.',
    },

  ]
}