
export function inviteDialogSteps(variables) {
  const { name, isCreator } = variables;
  const steps = [];
  if (isCreator) {
    steps.push({
      disableBeacon: true,
      target: '#emailInput',
      placement: 'bottom',
      content: 'Add collaborators here to let us send emails for you.',
    });
  } else {
    steps.push({
      disableBeacon: true,
      target: '#dialogMain',
      placement: 'center',
      title: `Welcome ${name}!`,
      content: 'Uclusion Dialogs let you and your collaborators make a decision by approving options.',
    });
  }
  steps.push({
    disableBeacon: true,
    placement: 'right',
    target: '#addOption',
    content: 'Click on an option or you can create something different.'
  });
  steps.push({
    disableBeacon: true,
    placement: 'top',
    target: '#commentAddLabelISSUE',
    content: 'Lastly, creating a Blocking Issue will halt the decision until it is resolved.',
  });
  return steps;
}