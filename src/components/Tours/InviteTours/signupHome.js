import React from 'react';
export function signupHomeSteps(variables) {
  const { name } = variables;
  return [
    {
      disableBeacon: true,
      target: '#root',
      placement: 'center',
      title: `Welcome to Uclusion ${name}!`,
      content: (
        <React.Fragment>
          We've created your first <a target='_blank' href='https://www.uclusion.com/autonomousteamwork' rel="noopener noreferrer">autonomous teamwork</a> collaborations.
        </React.Fragment>),
    },
    {
      disableBeacon: true,
      target: '#ini0',
      placement: 'top',
      content: "Initiatives let you gather feedback and measure support for an idea. We've created one for you to send to others.",
    },
    {
      disableBeacon: true,
      target: '#dia0',
      placement: 'left',
      content: "We've also created a Dialog as you and added someone from Uclusion. Dialogs let you reach decisions more easily.",
    },
    {
      disableBeacon: true,
      placement: 'left',
      target: '#ws1',
      content: 'A team Workspace is a great place to hold discussions and record materials.',
    },
    {
      disableBeacon: true,
      placement: 'right',
      target: '#ws0',
      content: "A Project Workspace is where you create requirements and execute stories.",
    }
  ]
}