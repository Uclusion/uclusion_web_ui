export const INVITE_INITIATIVE_FAMILY_NAME = 'INITIATIVE_INVITE';
export const INVITE_INITIATIVE_FIRST_VIEW = 'invite_initiative_first_view';

export function inviteInitiativeSteps(variables) {
  const { name } = variables;
  return [
    {
      disableBeacon: true,
      target: '#initiativeMain',
      title: `Welcome ${name}!`,
      content: 'Uclusion Initiatives let you and your collaborators vote for or against a proposal.',
    },
    {
      disableBeacon: true,
      target: '#initiativeMain',
      content: 'You can see what\'s proposed here in the description.',
    },
    {
      disableBeacon: true,
      target: '#pleaseVote',
      content: 'This section is where you can vote for or against the proposal.',
    },
    {
      disableBeacon: true,
      target: '#commentAddArea',
      content: 'Lastly, you can ask questions or provide suggestions down here.',
    },
  ]
}

