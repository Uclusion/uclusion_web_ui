
export function adminInitiativeSteps() {
  return [
    {
      disableBeacon: true,
      target: '#emailInput',
      placement: 'bottom',
      content: 'Add collaborators here to let us send emails for you.',
    },
    {
      disableBeacon: true,
      target: '#adminEditExpiration',
      placement: 'left',
      content: 'You can extend the deadline by clicking on the clock.',
    },
  ]
}

