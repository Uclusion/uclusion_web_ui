

export function workspaceInvitedUserSteps (variables) {
  const {
    name
  } = variables;
    return [{
      disableBeacon: true,
      target: 'body',
      placement: 'center',
      title: `Welcome ${name}!`,
      content: 'Groups are where your team collaborates to get things done without meetings.'
    }];
}