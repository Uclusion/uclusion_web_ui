export function signupHomeSteps(variables) {
  const { name } = variables;
  return [
    {
      disableBeacon: true,
      target: '#root',
      placement: 'center',
      title: `Welcome to Uclusion${name}!`,
      content: "We've created your first collaborations to get you started on your <a target='_blank' href='https://www.uclusion.com/autonomousteamwork'>autonomous teamwork</a> journey.",
    },
    {
      disableBeacon: true,
      target: '#ini0',
      placement: 'top',
      content: "Initiatives let you measure a support for an idea and gather feedback from your team. We've created your first one which you can edit and send out.",
    },
    {
      disableBeacon: true,
      target: '#dia0',
      placement: 'left',
      content: "After your team is comfortable with Initiatives, send them a Dialog which lets them weigh in on multiple options.",
    },
    {
      disableBeacon: true,
      placement: 'left',
      target: '#ws1',
      content: 'The Team Workspace we created for you is a great place to hold team-wide discussions, and record new member onboarding materials.',
    },
    {
      disableBeacon: true,
      placement: 'right',
      target: '#ws0',
      content: "When you're ready, the Small Project Workspace is where you can create requirements and execute stories.",
    }
  ]
}