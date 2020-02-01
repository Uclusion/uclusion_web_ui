export const PURE_SIGNUP_HOME = 'pure_signup_home';
export const PURE_SIGNUP_ADD_DIALOG = 'pure_signup_add_dialog';
export const PURE_SIGNUP_ADD_DIALOG_OPTIONS = 'pure_signup_add_options';
export const PURE_SIGNUP_ADD_FIRST_OPTION = 'pure_signup_add_first_option';
export const PURE_SIGNUP_VIEW_FIRST_OPTION = 'pure_signup_view_first_option';
export const PURE_SIGNUP_ADD_PEOPLE = 'pure_signup_add_people';

export const PURE_SIGNUP_HOME_STEPS = [
  {
    disableBeacon: true,
    target: '#createDialog',
    title: 'Welcome to Uclusion',
    content: 'Lets show you how Uclusion can help make decisions. One quick note, if you see a red beacon on the screen, you can click it to continue the tour.',
  },
  {
    disableBeacon: true,
    target: '#createDialog',
    title: 'Dialogs',
    content: "We'll be creating a new Dialog. To get started, click the 'Create Dialog' button",
  },
];

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
    disableBeacon: true,
  },
  {
    content: "Decisions have deadlines, and to make sure you get results in a timely manner the dialog will end and expire after a certain number of days. Slide the slider to the left and right to set the number of days, up to two weeks.",
    target: '#expires',
  },
  {
    content: "Most of the time, one sentence isn't enough to describe the decision to be made. Enter any contextual information needed into the description. If it's just lunch, then feel free to just enter the time you want to go",
    target: '#description',
  },
  {
    content: "Lastly, click save and we'll be taken to the Dialog's main screen where we can start adding the options we have for the decision",
    target: '#save',
  },
];

export const PURE_SIGNUP_ADD_DIALOG_OPTIONS_STEPS = [
  {
    title: 'Your New Dialog',
    content: "The first thing a new dialog needs is the options that we want to present. Click the 'Add Option' button in the sidebar to add the first one",
    target: '#newOption',
    disableBeacon: true,
  },
  {
    title: 'Dialog Current Voting',
    content: "You can see the newly created option in the 'Current Voting' section of the dialog. Votes will be visible in a histogram to the right of the name. The colors and position of the histogram convey the certainty, with uncerain being red and on the right and comlpetely certain being green and on the left.",
    target: '#option0',
  },
  {
    title: 'Add Some More Options',
    content: "A decision with just one option isn't really a decision, so add some more options, if it's lunch try adding your favorite food types. When you're done adding optons click the beacon over 'Manage Dialog' to resume the tour." ,
    target: '#currentVoting',
    disableBeacon: true,
  },
  {
    title: 'Invite People',
    content: "It's now time to invite other participants. Click the 'Manage Dialog' button in the sidebar.",
    target: '#manageDialog',
  },
  {
    title: 'Congrats on your first Dialog!',
    content: "Congratulations on creating your first decision, there's a few things we need to talk about before we let you go.",
    target: '#summary'
  },
  {
    title: 'Notifications',
    content: "When Uclusion has something for you to do, we'll display a notification alert down here. Red notifications mean something is blocked and needs your attention immediately, while Yellow needs action, but nothing is immediately blocked.",
    target: '#notifications',
    disableBeacon: true,
  },
  {
    title: 'Your Profile',
    target: '#profileLink',
    content: 'You can change your notification preferences, or perform profile actions by clicking on your name in the upper right of the screen. Now would be a good time to enable the Slack integration to get your notifications over Slack instead of email.',
    disableBeacon: true,
  }

];

export const PURE_SIGNUP_ADD_FIRST_OPTION_STEPS = [
  {
    title: 'The First Option',
    content: "Like dialogs, options need a name. This name will show in the dialog's 'Current Voting' section, so make it short, but descriptive. If we're having lunch, then add your favorite food type.",
    target: "#name",
    disableBeacon: true
  },
  {
    content: 'Options will also need a detailed description so people know what their voting for. Put those details in the description field. For lunch, just put the address of the eatery you want to go to for this food type',
    target: '#description'
  },
  {
    title: 'Save',
    target: '#save',
    content: "Great, almost done, all we need to do is save the option, and we'll be taken to see it.",
  }
];

export const PURE_SIGNUP_VIEW_FIRST_OPTION_STEPS = [
  {
    title: 'Your Option',
    content: 'Options are what participants can vote on, and are under your complete control',
    target: '#description',
    disableBeacon: true,
  },
  {
    title: 'Voting',
    content: "Options are voted for, and since you are also a participant in a dialog you vote too! Go ahead and click the 'Vote for this option' button",
    target: '#yourVote',
  },
  {
    title: 'Voting Explained',
    content: "Uclusion asks users two things about their dialog votes. The first is how certain they are about their vote. This helps both of you understand how much support the idea really has. The second is the reason why they voted for this option, and lets the participant give you context around thier vote",
    target: '#yourVote',
    disableBeacon: true,
  },
  {
    title: 'Vote',
    content: "Go ahead and enter a vote for this option, and give it a certainty and a reason. Don't worry if it's not the one you really want, as you can change your by voting on another option. You'll see your vote appear in the 'Current Voting' section below",
    disableBeacon: true,
    target: '#yourVote',
  },
  {
    title: 'Back to the Dialog',
    content: "Now that you've voted lets see how the option is displayed on the Dialog page. Click the dialog's name in the bread crumbs",
    target: '#marketCrumb',
  }
];

export const PURE_SIGNUP_ADD_PEOPLE_STEPS = [
  {
    title: 'Collaborate with Uclusion',
    content: "Decisions need more than one person to participate. Uclusion provides several ways to add new people to your Dialog",
    target: '#decisionAddressList',
    disableBeacon: true,
  },
  {
    title: 'Links',
    content: 'The first is to copy an invite link to your clipboard, and send them a message in whatever app is most convenient. If the person (or people) you are inviting are not going to vote, but just watch the proceedings, then send them the observer link.',
    target: "#inviteLinker",
    disableBeacon: true,
  },
  {
    title: 'Email',
    target: '#emailInput',
    content: "If you'd prefer we message them you can enter an email here, and click 'Invite Participant'. They'll get a nicely formatted email telling them what to do. If you want them to be an observer, check the 'Is Observer' box before you click invite.",
    disableBeacon: true,
  },
  {
    title: 'Address Book',
    content: "Lastly, if you've used Uclusion with them before, they'll show up in your address book. Select the people you want to add and click 'Add Participants' to add them. If you're having trouble finding them, try searching for them by name.",
    target: '#addressBook',
    disableBeacon: true,
  },
  {
    title: 'Get Collaborating',
    content: "Add whomever you want to participate in this dialog, and we'll make sure they stay up to date. When you're done adding people, click the dialog's name in the breadcrumbs to return to the dialog page",
    target: '#marketCrumb',
    disableBeacon: true,
  }
];