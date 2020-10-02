
export function inviteInitiativeSteps(variables) {
  const { name } = variables;
  return [
    {
      disableBeacon: true,
      target: '#initiativeMain',
      placement: 'center',
      title: `Welcome ${name}!`,
      content: 'A Uclusion Initiative is an interactive way to collaborate on a proposal.',
    },
    {
      disableBeacon: true,
      target: '#initiativeMain',
      placement: 'bottom',
      content: 'You can see what\'s proposed here in the description.',
    },
    {
      disableBeacon: true,
      target: '#pleaseVote',
      placement: 'top',
      content: 'Vote here for or against with a certainty and reason. If the initiative changes you can change your vote.',
    },
    {
      disableBeacon: true,
      target: '#cabox',
      placement: 'top',
      content: 'Lastly, you can ask questions or provide suggestions in this section.',
    },
  ]
}

