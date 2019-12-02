import { defineMessages } from 'react-intl';
const messages = defineMessages({
  app_name: 'Uclusion',
  about: 'About',
  page_not_found_demo: 'Page not found demo',
  404: '404',
  warning_404_message: '404 Page not found',
  warning_404_description: 'We are sorry but the page you are looking for does not exist.',
  warning_404_categories: 'No categories configured for this market.',
  slack_register_failed: 'Slack registration failure.',
  settings: 'Settings',
  language: 'Language',
  theme: 'Theme',
  responsive: 'Responsive',
  en: 'English',
  de: 'Deutsch',
  bs: 'Bosanski',
  ru: 'Русский',
  es: 'Español',
  dark: 'Dark',
  light: 'Light',
  default: 'Default',
  green: 'Green',
  red: 'Red',
  sign_out: 'Sign out',
  day_mode: 'Day Mode',
  days: 'days',
  hours: 'hours',
  minutes: 'minutes',
  night_mode: 'Night Mode',
  sign_in: 'Sign in',
  sign_up: 'Sign up',
  continue: 'Continue',
  homeBreadCrumb: 'Home',
  reset_password_header: 'Reset Password',
  login_header: 'Log In',
  sign_in_with_google: 'Sign in with Google',
  sign_in_with_facebook: 'Sign in with Facebook',
  sign_in_with_twitter: 'Sign in with Twitter',
  sign_in_with_github: 'Sign in with Github',
  my_account: 'My account',
  name: 'Name',
  adminName: 'Name of new admin',
  email: 'E-Mail',
  password: 'Password',
  new_password: 'New Password',
  confirm_password: 'Confirm Password',
  forgort_password: 'Forgot Password?',
  reset_password: 'Reset Password',
  change_password: 'Change Password',
  change_photo: 'Change Photo',
  change_email: 'Change E-Mail',
  reset_password_hint: 'Enter your E-Mail',
  save: 'Save',
  delete_account: 'Delete account',
  select_file: 'Select file',
  cancel: 'Cancel',
  submit: 'Submit',
  delete: 'Delete',
  ok: 'OK',
  delete_account_dialog_title: 'Delete Account?',
  delete_account_dialog_message: 'Your account will be deleted and you will lose all your data!',
  email_not_verified: 'E-Mail is not verified!',
  email_verified: 'E-Mail is verified',
  send_verification_email: 'Send verification E-Mail',
  send_verification_email_again: 'Send verification E-Mail again',
  check_email_code: 'Please check your email for a verification code',
  investibles: 'Investibles',
  users: 'Users',
  edit: 'Edit',
  online: 'Online',
  offline: 'Offline',
  no_connection_warning: 'No connection!',
  title_label: 'Title',
  title_hint: 'Enter title',
  no_connection: 'No connection',
  delete_task_title: 'Delete task?',
  delete_task_message: 'The task will be deleted!',
  error: 'Error!',
  create_company: 'Create company',
  edit_company: 'Edit company',
  description_label: 'Description',
  description_hint: 'Enter description',
  name_label: 'Name',
  name_hint: 'Enter name',
  public_chats: 'Public chat',
  delete_message_title: 'Delete message?',
  delete_message_message: 'Message will be deleted!',
  users_count_title: '{number} Users',
  user_registrationg_graph_label: 'User registrations',
  required: 'Required',
  facebook: 'Facebook',
  github: 'Github',
  twitter: 'Twitter',
  phone: 'Phone',
  google: 'Google',
  facebook_color: '#303F9F',
  github_color: '#263238',
  twitter_color: '#36A2EB',
  phone_color: '#90A4AE',
  google_color: '#EA4335',
  password_color: '#4CAF50',
  chats: 'Chats',
  write_message_hint: 'Write message...',
  load_more_label: 'More...',
  my_location: 'My Location',
  select_user: 'Select user',
  operator_like_label: 'like',
  operator_notlike_label: 'not like',
  operator_equal_label: 'equal',
  operator_notequal_label: 'not equal',
  operator_novalue_label: 'no value',
  administration: 'Administration',
  roles: 'Roles',
  grants: 'Grants',
  private: 'Private',
  public: 'Public',

  // Loadable Image
  loadableImageAlt: 'User provided image',

  // Sidebar Nav menu names
  sidebarNavDialogs: 'Decision Dialogs',
  sidebarNavActionItems: 'Action Items',
  sidebarNavTemplates: 'Templates',
  sidebarNavNotifications: 'Action Center',
  sideBarNavTempSignout: 'Signout(Temp)',
  sidebarNewPlanning: 'Create New Plan',

  loadingMessage: 'Loading',

  // ExpirationSelector
  expirationSelectorOneDay: '1 day',
  expirationSelectorXDays: '{x} days',

  // Market Add
  marketAddTitleDefault: 'Add a name...',
  marketAddTitleLabel: 'Name',
  marketAddDescriptionDefault: 'Add a description...',
  marketAddCancelLabel: 'Cancel',
  marketAddSaveLabel: 'Save',
  marketAddExpirationLabel: 'Dialog ends after {x} day(s)',

  // Market Nav
  marketNavTabContextLabel: 'Context',
  marketNavTabAddIdeaLabel: 'Add New',

  // Market Edit
  marketEditTitleLabel: 'Name',
  marketEditCancelLabel: 'Cancel',
  marketEditSaveLabel: 'Save',

  // MarketEditButton:
  marketEditButtonTooltip: 'Edit',

  // InvestibleEditButton
  investibleEditButtonTooltip: 'Edit',

  // CurrentVoting
  numVoting: '{x} votes',

  // InvestibleAdd
  investibleAddTitleDefault: 'Add a name...',
  investibleAddTitleLabel: 'Name',
  investibleAddDescriptionDefault: 'Add a description...',
  investibleAddCancelLabel: 'Cancel',
  investibleAddSaveLabel: 'Save',
  investibleAddDirectLabel: 'Add directly to current voting',


  // InvestibleEdit
  investibleEditTitleLabel: 'Title',
  investibleEditCancelLabel: 'Cancel',
  investibleEditSaveLabel: 'Save',
  investibleEditAcceptLabel: 'Accept Assignment',
  investibleEditArchiveLabel: 'Archive Assignment',
  investibleEditSubmitLabel: 'Submit',

  // Investible
  investibleEditLabel: 'Edit',
  investibleAddHeader: 'Add Investible',
  investibleEditStageHelper: 'Select to change stage',
  investibleEditInvestibleFetchFailed: 'There was a problem loading your investible for edit. Please try again later',


  // Issues
  issueResolveLabel: 'Resolve',
  issueReplyLabel: 'Reply',

  // CommentAdd
  commentAddIssueDefault: 'Your issue...',
  commentAddQuestionDefault: 'Your question...',
  commentAddSuggestDefault: 'Your suggested change...',
  commentAddReplyDefault: 'Your reply...',
  commentAddSaveLabel: 'Save',
  commentAddCancelLabel: 'Cancel',

  // CommentBox
  commentIconRaiseIssueLabel: 'Raise Issue',
  commentIconAskQuestionLabel: 'Ask Question',
  commentIconSuggestChangesLabel: 'Suggest Changes',

  // Comments
  commentReplyDefault: 'Your reply...',
  commentReplyLabel: 'Reply',
  commentReplySaveLabel: 'Save',
  commentReplyCancelLabel: 'Cancel',
  commentReopenLabel: 'Reopen',
  commentResolveLabel: 'Resolve',
  commentViewThread: 'View',

  // Notices
  noticeNewApplicationVersion: 'A new version of the application is available! It will load when you close this message.',

  // Proper names - DO NOT TRANSLATE
  uclusionPlanningMarket: 'Uclusion Planning',

  // stages
  marketStageFollowTooltip: 'Subscribe',
  marketStageUnFollowTooltip: 'Unsubscribe',

  // markets
  marketSelectDefault: 'Your Dialogs',
  marketFollowTooltip: 'Subscrbe',
  marketUnFollowTooltip: 'Unsubscribe',
  marketUnspent: 'Total unspent uShares in this market',
  marketActiveInvestments: 'Total actively invested uShares in this market',

  // Rich text editor
  RichTextEditorAddLinkTitle: 'Add Link',
  RichTextEditorEnterUrl: 'Enter the URL of the link:',
  RichTextEditorEnterTextAndLink: 'Enter the URL and text of the link:',
  RichTextEditorLinkLabel: 'Link',
  RichTextEditorTextLabel: 'Text',
  RichTextEditorToManyBytes: 'To much data. Please remove items from the editor',

  // Investible detail
  investibleDetailClose: 'Close',

  // Home
  homeSubsectionPlanning: 'Epic Planning Dialogs',
  homeSubsectionDecision: 'Decision Dialogs',
  homeAddDecision: 'Create Decision',
  homeAddPlanning: 'Creat Epic Plan',

  // Decision Dialogs
  decisionDialogsStartedBy: 'Started By: {name}',
  decisionDialogsExpires: 'Expires:',
  decisionDialogsObserverLabel: 'Observer',
  decisionDialogsParticipantLabel: 'Participant',
  decisionDialogsExtendDeadline: 'Extend Deadline',
  decisionDialogsCancelDialog: 'Cancel Dialog',
  decisionDialogsExitDialog: 'Exit Dialog',
  decisionDialogsBecomeObserver: 'Become Observer',
  decisionDialogsBecomeParticipant: 'Become Participant',
  decisionDialogsInviteParticipant: 'Invite Participant',
  decisionDialogsArchiveDialog: 'Archive Dialog',

  // Planning Dialog
  planningDialogSummaryLabel: 'Plan Information',
  planningDialogPeopleLabel: 'In progress and in voting assigned stories',
  planningDialogDiscussionLabel: 'Discussion',
  planningDialogAddInvestibleLabel: 'Create story',
  planningNoneAcceptedWarning: 'No in progress assignment',
  planningNoneInDialogWarning: 'No votable assignment',
  acceptedInvestiblesUpdatedAt: 'In progress from ',
  inDialogInvestiblesUpdatedAt: 'Assigned for voting on ',
  blockedInvestiblesUpdatedAt: 'Blocked since ',

  // Decision Dialog
  decisionDialogSummaryLabel: 'Background Information',
  decisionDialogCurrentVotingLabel: 'Current Voting',
  decisionDialogProposedOptionsLabel: 'Proposed Options',
  decisionDialogDiscussionLabel: 'Discussion',
  decisionDialogAddInvestibleLabel: 'Propose Option',

  // Investibles in decision dialog display
  decisionDialogInvestiblesUpdatedAt: 'Last Updated:',


  // DecisionInvestible
  decisionInvestibleYourVoting: 'Your CurrentVoting',
  decisionInvestibleOthersVoting: "Other's CurrentVoting",
  decisionInvestibleDescription: 'Description',
  decisionInvestibleDiscussion: 'Discussion',

  // About
  sidebarNavAbout: 'About',
  aboutApplicationVersionLabel: 'Version',
  aboutMarketIdLabel: 'Dialog ID',
  aboutAccountIdLabel: 'Account ID',
  aboutAccountNameLabel: 'Account Name',
  aboutUserIdLabel: 'User ID',
  aboutUserNameLabel: 'User Name',
  aboutUclusionEmailLabel: 'Support',
  aboutClearStorageButton: 'Clear Storage',

  // decision sidebar
  addOptionLabel: 'Add Option',


  // expiration extender
  deadlineExtenderSave: 'Extend',
  deadlineExtenderCancel: 'Cancel',

  //invite linker
  inviteLinkerDirections: 'Share this link to invite others to the dialog',
  inviteLinkerCopyToClipboard: 'Copy to clipboard',

  // API errors
  errorDecisionInvestibleAddFailed: 'There was a problem adding the option.',
  errorPlanningInvestibleAddFailed: 'There was a problem adding the story',
  errorInvestibleStageChangeFailed: 'There was a problem accepting or archiving the assignment',
  errorInvestibleUpdateFailed: 'There was a problem updating the option.',
  errorCommentFetchFailed: 'There was a problem retrieving comments',
  errorCommentSaveFailed: 'There was a problem saving your comment',
  errorInvestmentUpdateFailed: 'There was a problem updating your vote',
  errorDecisionAddFailed: 'There was a problem creating your Decision',
  errorPlanningAddFailed: 'There was a problem creating your Epic Plan',
  errorFileUploadFailed: 'There was a problem uploading your file',
  errorEditLockFailed: 'There was a problem getting permission to edit',
  errorEditLockReleaseFailed: 'There was a problem releasing edit permission',
  errorSubmitToModeratorFailed: 'There was a problem submitting to the moderator',
  errorChangeToObserverFailed: 'There was a problem becoming to an observer',
  errorChangeToParticipantFailed: 'There was a problem becoming a participant',
  errorMarketUpdateFailed: 'There was a problem editing the dialog',
  errorMarketExpirationExtendFailed: 'There was a problem extending the deadline',
  errorMarketLeaveFailed: 'There was a problem leaving the dialog',
  errorCommentResolveFailed: 'There was a problem resolving',
  errorCommentReopenFailed: 'There was a problem reopening',
  errorMarketArchiveFailed: 'There was a problem archiving the dialog',

});

export default messages;
