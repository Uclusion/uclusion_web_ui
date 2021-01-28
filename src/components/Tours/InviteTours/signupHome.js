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
          We've created your first collaborations.
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
      placement: 'right',
      target: '#ws0',
      content: "A project Workspace is where you create requirements and execute stories.",
    }
  ]
}