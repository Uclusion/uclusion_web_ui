
export function inviteDialogSteps(variables) {
  const { name } = variables;
  return [
    {
      disableBeacon: true,
      target: '#dialogMain',
      placement: 'center',
      title: `Welcome ${name}!`,
      content: 'Uclusion Dialogs let you and your collaborators make a decision by voting for the options you prefer.',
    },
    {
      disableBeacon: true,
      target: '#option0',
      placement: 'right',
      content: 'Click on an option to see its details and vote for it.',
    },
    {
      disableBeacon: true,
      placement: 'right',
      target: '#addOption',
      content: 'Or you can create something different.'
    },
    {
      disableBeacon: true,
      placement: 'top',
      target: '#commentAddLabelISSUE',
      content: 'Lastly, creating a Blocking Issue will halt the decision until it is resolved.',
    }
  ];
}