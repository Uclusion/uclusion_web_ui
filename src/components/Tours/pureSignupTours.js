export const PURE_SIGNUP_FAMILY_NAME = 'pure_signup';
export const PURE_SIGNUP_HOME = 'pure_signup_home';
export const PURE_SIGNUP_ADD_DIALOG = 'pure_signup_add_dialog';
export const PURE_SIGNUP_ADD_DIALOG_OPTIONS = 'pure_signup_add_options';
export const PURE_SIGNUP_ADD_FIRST_OPTION = 'pure_signup_add_first_option';
export const PURE_SIGNUP_VIEW_FIRST_OPTION = 'pure_signup_view_first_option';
export const PURE_SIGNUP_ADD_PEOPLE = 'pure_signup_add_people';

export const PURE_SIGNUP_SEQUENCE = [
  PURE_SIGNUP_HOME,
  PURE_SIGNUP_ADD_DIALOG,
  PURE_SIGNUP_ADD_DIALOG_OPTIONS,
  PURE_SIGNUP_ADD_FIRST_OPTION,
  PURE_SIGNUP_VIEW_FIRST_OPTION,
  PURE_SIGNUP_ADD_PEOPLE
];



export function pureSignupHomeSteps(variables) {
  const { name } = variables;
  return [
    {
      disableBeacon: true,
      target: '#createDialog',
      title: `Welcome to Uclusion ${name}!`,
      content: "Let's see how Uclusion can help make decisions by creating a new dialog",
      onClose: () => document.getElementById('createDialog').click(),
    },
  ];
}

export const PURE_SIGNUP_ADD_DIALOG_STEPS = [
  {
    title: 'Making Decisions',
    content: "If you don't have a decision you need help with right now, then getting lunch with your friends is a good start.",
    target: '#tourRoot',
    placement: 'top-start',
    disableBeacon: true,
  },
  {
    content: "Enter a good short name for your dialog in the name field, or 'Where should we get lunch' if you don't have one.",
    target: '#name',
    placement: 'auto',
    disableBeacon: true,
  },
  {
    content: "Decisions have deadlines. Slide the slider to the left and right to set the number days until your deadline.",
    target: '#expires',
    placement: 'auto',
  },
  {
    content: "Enter any contextual information needed into the description",
    target: '#description',
  },
];

export const PURE_SIGNUP_ADD_DIALOG_OPTIONS_STEPS = [
  {
    title: 'Dialog Current Voting',
    content: "You can see the newly created option, and a vote summary, here.",
    target: '#option0',
    disableBeacon: true,
  },
  {
    title: 'Add Some More Options',
    content: "A decision with just one option isn't really a decision, so add some more options. When you're done, click the beacon over 'Manage Dialog' to resume the tour.",
    target: '#currentVoting',
    disableBeacon: true,
  },
  {
    title: 'Invite People',
    content: "You can invite the other participants via the 'Manage Dialog' button.",
    target: '#manageDialog',
    onClose: () => document.getElementById('manageDialog').click(),
  },
  {
    title: 'Congrats on your first Dialog!',
    content: "Before you go there's a few things we need tell you.",
    target: '#summary'
  },
  {
    title: 'Notifications',
    content: "We'll display notification alert downs here. Red notifications mean something is blocked, while Yellow needs attention.",
    target: '#notifications',
    disableBeacon: true,
  },
  {
    title: 'Your Profile',
    target: '#profileLink',
    content: 'You can change your profile and notification preferences here.',
    disableBeacon: true,
  }
];

export const PURE_SIGNUP_ADD_FIRST_OPTION_STEPS = [
  {
    title: 'Your New Dialog',
    content: "When you create a dialog we'll take you directly to the add options page to create the first one.",
    target: '#name',
    disableBeacon: true,
  },
  {
    title: 'The First Option',
    content: "Options need a name that is short, but descriptive. If we're having lunch, then add your favorite food type.",
    target: "#name",
    disableBeacon: true
  },
  {
    content: "The details go here in the description. When you're done, click 'Save'",
    target: '#description'
  },
];

export const PURE_SIGNUP_ADD_PEOPLE_STEPS = [
  {
    title: 'Collaborate with Uclusion',
    content: "Uclusion provides several ways to add new people to your Dialog",
    target: '#decisionAddressList',
    disableBeacon: true,
  },
  {
    title: 'Links',
    content: 'The first is to copy an invite link to your clipboard, and send them a message. If the people you are inviting are not going to vote, then send them the observer link.',
    target: "#inviteLinker",
    disableBeacon: true,
  },
  {
    title: 'Email',
    target: '#emailInput',
    content: "If you'd prefer we message them you can enter an email here, and click 'Invite Participant'. They'll get a nicely formatted email telling them what to do.",
    disableBeacon: true,
  },
  {
    title: 'Get Collaborating',
    content: "We'll make sure participants stay up to date. When you're done adding people, click the dialog's name in the breadcrumbs to return to the dialog.",
    target: '#marketCrumb',
    disableBeacon: true,
  }
];