export const INVITE_REQ_WORKSPACE_FIRST_VIEW = 'invite_req_workspace_first_view';

export function inviteRequirementsWorkspaceSteps(variables) {
  const { name } = variables;
  return [
    {
      disableBeacon: true,
      target: '#workspaceMain',
      title: `Welcome ${name}!`,
      content: 'Uclusion Workspaces let you and your team smoothly collaborate on requirements.',
    },
    {
      disableBeacon: true,
      target: '#workspaceMain',
      content: 'The Workspace description will contain the requirements and can be edited by anyone.',
    },
    {
      disableBeacon: true,
      target: '#commentAddArea',
      content: 'Structured discussion happens down here. We\'ll take care of notifying the appropriate people and make sure conversation moves forward.',
    },
    {
      disableBeacon: true,
      target: '#addStory',
      content: 'Lastly, if you want to create and track stories related to the requirements you can do so with the \'Create Story\' button.',
    }
  ]
}