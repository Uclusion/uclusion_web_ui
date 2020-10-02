import React from 'react';
export function signupHomeSteps(variables) {
  const { name } = variables;
  return [
    {
      disableBeacon: true,
      target: '#root',
      placement: 'center',
      title: `Welcome to Uclusion${name}!`,
      content: (
        <React.Fragment>
          We've created your first collaborations to get you started on your <a target='_blank' href='https://www.uclusion.com/autonomousteamwork' rel="noopener noreferrer">autonomous teamwork</a> journey.
        </React.Fragment>),
    },
    {
      disableBeacon: true,
      target: '#ini0',
      placement: 'top',
      content: "Initiatives let you gather feedback and measure support for an idea. We've created your first one so you can try sending it to others.",
    },
    {
      disableBeacon: true,
      target: '#dia0',
      placement: 'left',
      content: "We've also created a Dialog as you and added someone from Uclusion as a collaborator. Dialogs let you reach decisions more easily.",
    },
    {
      disableBeacon: true,
      placement: 'left',
      target: '#ws1',
      content: 'A Team Workspace is a great place to hold team-wide discussions, and record new member onboarding materials.',
    },
    {
      disableBeacon: true,
      placement: 'right',
      target: '#ws0',
      content: "When you're ready, a Project Workspace is where you create requirements and execute stories.",
    }
  ]
}