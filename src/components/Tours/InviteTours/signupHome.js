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
          We've created somethings for you to help you get familiar.
        </React.Fragment>),
    },
    {
      disableBeacon: true,
      placement: 'right',
      target: '#ws0',
      content: "A Workspace is where you create requirements and bugs and execute stories.",
    }
  ]
}