export const ADMIN_INITIATIVE_FIRST_VIEW = 'admin_initiative_first_view';

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
      target: '#adminEdit',
      placement: 'left',
      content: 'You can make changes to the proposal by editing it.',
    },
    {
      disableBeacon: true,
      target: '#adminEditExpiration',
      placement: 'left',
      content: 'Or extend the deadline by clicking on the clock.',
    },
    {
      disableBeacon: true,
      placement: 'left',
      target: '#adminManageCollaborators',
      content: 'Lastly, collaborators can be added here.',
    },

  ]
}

