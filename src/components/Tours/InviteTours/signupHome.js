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
          This is your home screen. We've created a demonstration to show you how Uclusion works.
        </React.Fragment>),
    },
    {
      disableBeacon: true,
      placement: 'right',
      target: '#ws0',
      content: "Feel free to explore. When you are ready, click on this Workspace to continue the tour.",
    }
  ]
}