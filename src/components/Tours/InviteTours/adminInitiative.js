
export function adminInitiativeSteps(variables) {
  const { name } = variables;
  return [
    {
      disableBeacon: true,
      target: '#initiativeMain',
      placement: 'center',
      title: `Welcome ${name}!`,
      content: 'Uclusion Initiatives let your collaborators vote for or against your proposal.',
    },
    {
      disableBeacon: true,
      target: '#adminEditExpiration',
      placement: 'left',
      content: 'You can extend the deadline by clicking on the clock.',
    },
    {
      disableBeacon: true,
      placement: 'left',
      target: '#adminManageCollaborators',
      content: 'This initiative is all ready to go, so send it to your team by adding collaborators here.',
    },

  ]
}

