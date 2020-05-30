export const ADMIN_INITIATIVE_FAMILY_NAME = 'ADMIN_INITIATIVE_INVITE';
export const ADMIN_INITIATIVE_FIRST_VIEW = 'admin_initiative_first_view';

export function adminInitiativeSteps(variables) {
  const { name } = variables;
  return [
    {
      disableBeacon: true,
      target: '#initiativeMain',
      title: `Welcome ${name}!`,
      content: 'Uclusion Initiatives let your collaborators vote for or against your proposal.',
    },
    {
      disableBeacon: true,
      target: '#adminEdit',
      content: 'You can make changes to the proposal by editing it.',
    },
    {
      disableBeacon: true,
      target: '#adminEditExpiration',
      content: 'Or extend the deadline by clicking on the clock.',
    },
    {
      disableBeacon: true,
      target: '#adminManageCollaborators',
      content: 'Lastly, collaborators can be added or removed here.',
    },

  ]
}

