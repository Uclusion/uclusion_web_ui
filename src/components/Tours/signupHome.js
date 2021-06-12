import { isTinyWindow } from '../../utils/windowUtils'

export function signupHomeSteps(variables) {
  const { name } = variables;
  if (isTinyWindow()) {
    return [
      {
        disableBeacon: true,
        placement: 'right',
        target: '#AddNew',
        title: `Welcome to Uclusion ${name}!`,
        content: "Add new when you are ready to create your own Workspace, Initiative or Dialog."
      },
      {
        disableBeacon: true,
        placement: 'right',
        target: '#decisionDialogsBecomeObserver',
        content: "This is the Workspace archive button for when you are done with the Demonstration Workspace.",
      },
      {
        disableBeacon: true,
        placement: 'right',
        target: '#ws0',
        content: "Click the Demonstration Workspace to continue the tour.",
      }
    ];
  }
  return [
    {
      disableBeacon: true,
      target: '#helpIcon',
      placement: 'bottom',
      title: `Welcome to Uclusion ${name}!`,
      content: "This icon takes you to our help guide."
    },
    {
      disableBeacon: true,
      placement: 'right',
      target: '#AddNew',
      content: "Add new when you are ready to create your own Workspace, Initiative or Dialog.",
    },
    {
      disableBeacon: true,
      placement: 'right',
      target: '#decisionDialogsBecomeObserver',
      content: "This is the Workspace archive button for when you are done with the Demonstration Workspace.",
    },
    {
      disableBeacon: true,
      placement: 'right',
      target: '#ws0',
      content: "Click the Demonstration Workspace to continue the tour.",
    }
  ]
}