export const INVITE_DIALOG_FAMILY_NAME = 'DIALOG_INVITE';
export const INVITE_DIALOG_FIRST_VIEW = 'invite_dialog_first_view';
export const INVITE_DIALOG_SEQUENCE = [
  INVITE_DIALOG_FIRST_VIEW,
]

export function inviteDialogSteps(variables) {
  const { name } = variables;
  return [
    {
      disableBeacon: true,
      target: '#dialogMain',
      title: `Welcome ${name}!`,
      content: 'Uclusion Dialogs let you and your collaborators make a decision by voting for the options you prefer.',
    },
    {
      disableBeacon: true,
      target: '#option0',
      content: 'Click on an option to see its details and vote for it.',
    },
    {
      disableBeacon: true,
      target: '#proposeOption',
      content: 'Or suggest something different with Propose Option.'
    },
    {
      disableBeacon: true,
      target: '#commentAddArea',
        content: 'Lastly, structured discussion happens down here.',
    }
  ];
}