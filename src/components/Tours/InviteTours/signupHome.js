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
          We've created a demonstration Workspace to show you how Uclusion works.
        </React.Fragment>),
    },
    {
      disableBeacon: true,
      placement: 'right',
      target: '#ws0',
      content: "Here's where you create requirements, file bugs, and execute stories.",
    }
  ]
}