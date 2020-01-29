import { defineMessages } from 'react-intl';

const messages = defineMessages({
  app_name: 'Uclusion',
  support: 'Support',
  page_not_found_demo: 'Page not found demo',
  404: '404',
  warning_404_message: '404 Page not found',
  warning_404_description: 'We are sorry but the page you are looking for does not exist.',
  warning_404_categories: 'No categories configured for this market.',
  warning: 'Warning',
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
  daysLeft: 'days left',
  hoursLeft: 'hours left',
  minutesLeft: 'min left',
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
  manage: 'Manage',
  edit: 'Edit',
  edit_lock: 'Someone else is editing!',
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
  created_by: 'Created by',
  observers: 'Approver:',
  dialogParticipants: 'Collaborators',
  dialogObservers: 'Approvers',
  isObserver: 'Is Approver',

  addDecision: 'Add Dialog',
  addPlanning: 'Add Agile Plan',
  addInitiative: 'Add Initiative',

  // Support
  supportInfoText: 'Create a bug in https://github.com/Uclusion/uclusion_customer_issues/issues or send an email to support@uclusion.com which includes steps to reproduce and the version and user ID above. To request a feature open a Dialog or Initiative explaining your use case or solution respectively and send the invite link to support@uclusion.com.',
  featureRequest: 'Feature Request',
  createFeatureRequest: 'Create feature request',
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
  loadingMarket: 'Processing Invite',
  loadingSlack: 'Processing Slack Integration',

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
  investmentExpirationInputLabel: 'Number of days before a vote expires',
  maxMaxBudgetInputLabel: 'Maximum number of days for story budget',
  daysEstimateInputLabel: 'Very rough number of days to complete these requirements',

  // Market Nav
  marketNavTabContextLabel: 'Context',
  marketNavTabAddIdeaLabel: 'Add New',

  // Market Edit
  marketEditTitleLabel: 'Name',
  marketEditCancelLabel: 'Close',
  marketEditSaveLabel: 'Save',

  // MarketEditButton:
  dialogEditButtonTooltip: 'Edit Dialog',

  // InvestibleEditButton
  investibleEditButtonTooltip: 'Edit',

  // CurrentVoting
  numVoting: '{x} votes',
  certain: 'Certain',
  veryCertain: 'Very Certain',
  somewhatCertain: 'Somewhat Certain',
  somewhatUncertain: 'Somewhat Uncertain',
  uncertain: 'Uncertain',
  maxBudget: '{x} days value',
  certaintyQuestion: 'How certain are you of your vote?',
  reasonQuestion: 'Why did you vote for this option?',
  saveVote: 'Save',
  updateVote: 'Update Vote',
  yourReason: 'Your reason...',
  cancelVote: 'Cancel',
  removeVote: 'Remove Vote',
  maxBudgetInputLabel: 'Number of days before might not be worth doing - value must be less than {x}',

  // Address list
  addressAddCancelLabel: 'Close',
  addressAddClearLabel: 'Close',
  addressAddSaveLabel: 'Add Participants',
  inviteParticipantsLabel: 'Invite Participants',

  // InvestibleAdd
  investibleAddTitleDefault: 'Add a name...',
  investibleAddTitleLabel: 'Name',
  investibleAddDescriptionDefault: 'Add a description...',
  investibleAddCancelLabel: 'Cancel',
  investibleAddSaveLabel: 'Save',


  // InvestibleEdit
  investibleEditTitleLabel: 'Title',
  investibleEditCancelLabel: 'Cancel',
  investibleEditSaveLabel: 'Save',
  investibleEditAcceptLabel: 'Accept Assignment',
  investibleEditArchiveLabel: 'Archive Assignment',
  investibleEditSubmitLabel: 'Submit',
  descriptionEdit: 'Description. Changes will be stored locally until you save or cancel.',

  // Investible
  investibleEditLabel: 'Edit',
  investibleAddHeader: 'Add Investible',
  investibleEditStageHelper: 'Select to change stage',
  investibleEditInvestibleFetchFailed: 'There was a problem loading your investible for edit. Please try again later',
  investibleAddToVotingLabel: 'Move to Current Voting',
  investibleDeleteLabel: 'Permanently Delete',
  planningInvestibleNextStageAcceptedLabel: 'Move to In Progress',
  planningInvestibleNextStageInReviewLabel: 'Move to In Review',
  planningInvestibleMoveToVerifiedLabel: 'Move to Verified',
  planningInvestibleMoveToNotDoingLabel: 'Move to Not Doing',
  planningVotingStageLabel: 'Voting',
  planningAcceptedStageLabel: 'In Progress',
  planningBlockedStageLabel: 'Blocked',
  planningReviewStageLabel: 'In Review',
  planningVerifiedStageLabel: 'Verified',
  planningNotDoingStageLabel: 'Not Doing',
  planningInvestibleAssignments: 'Assignments',
  lockedBy: 'Locked by {x}',
  lockFailedWarning: 'Failed to acquire lock. Retry?',
  breakLock: 'Break Lock',
  newStory: 'New Story',

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
  issueWarning: 'Opening an issue will halt voting on this dialog.',
  issueWarningInvestible: 'Opening an issue will halt voting on this option.',
  issueWarningPlanning: 'Opening an issue will move this story to blocked and stop execution or voting.',

  // CommentBox
  commentIconRaiseIssueLabel: 'Raise Issue',
  commentIconAskQuestionLabel: 'Ask Question',
  commentIconSuggestChangesLabel: 'Suggest Changes',

  // Comments
  commentReplyDefault: 'Your reply...',
  commentReplyLabel: 'Reply',
  commentEditLabel: 'Edit',
  commentReplySaveLabel: 'Save',
  commentReplyCancelLabel: 'Cancel',
  commentReopenLabel: 'Reopen',
  commentResolveLabel: 'Resolve',
  commentViewThreadLabel: 'View Thread',
  commentCloseThreadLabel: 'Close Thread',
  lastUpdatedBy: 'Last Updated By',

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
  homeSubsectionPlanning: 'Agile Plans',
  homeSubsectionDecision: 'Dialogs',
  homeAddDecision: 'Create Dialog',
  homeAddPlanning: 'Create Agile Plan',
  homeAddInitiative: 'Create Initiative',
  homePlanningReport: 'Active Story Value Estimates (in days)',
  homeViewArchives: 'View Archives',
  homeViewAbout: 'About',
  homeCreatedAt: 'Created on {dateString}',
  archiveWarning: 'Archive will make inactive and cannot be undone.',
  new: 'New',
  information: 'Information',
  message: 'Message',
  // Archives
  archivesTitle: 'Archives',


  // Decision Dialogs
  decisionDialogsStartedBy: 'Started By: {name}',
  decisionDialogsExpires: 'Expires:',
  decisionDialogsObserverLabel: 'Observer',
  decisionDialogsParticipantLabel: 'Participant',
  decisionDialogsExtendDeadline: 'Extend Deadline',
  decisionDialogsDismissDialog: 'Dismiss',
  decisionDialogsRestoreDialog: 'Restore',
  decisionDialogsBecomeObserver: 'Become Observer',
  decisionDialogsBecomeParticipant: 'Become Participant',
  decisionDialogsInviteParticipant: 'Invite Participant',
  decisionDialogsArchiveDialog: 'Deactivate',

  // Planning Dialog
  planningDialogManageParticipantsLabel: 'Manage Participants',
  planningDialogSummaryLabel: 'Plan Detail',
  planningDialogPeopleLabel: 'Collaborator\'s stories',
  planningDialogDiscussionLabel: 'Discussion',
  planningDialogAddInvestibleLabel: 'Create story',
  planningDialogViewArchivesLabel: 'View Archives',
  planningNoneAcceptedWarning: 'No in progress assignment',
  planningNoneInDialogWarning: 'No votable assignment',
  acceptedInvestiblesUpdatedAt: 'In progress from ',
  reviewingInvestiblesUpdatedAt: 'In review from ',
  inDialogInvestiblesUpdatedAt: 'Assigned for voting on ',
  blockedInvestiblesUpdatedAt: 'Blocked since ',

  // Decision Dialog
  decisionDialogSummaryLabel: 'Background Information',
  decisionDialogCurrentVotingLabel: 'Current Voting',
  decisionDialogProposedOptionsLabel: 'Proposed Options',
  decisionDialogDiscussionLabel: 'Discussion',
  decisionDialogAddInvestibleLabel: 'Add Option',
  decisionDialogProposeInvestibleLabel: 'Propose Option',
  decisionDialogExtendDaysLabel: 'Number of days to extend deadline?',

  // Investibles in decision dialog display
  decisionDialogInvestiblesUpdatedAt: 'Last Updated:',
  dialogManageLabel: 'Manage Dialog',
  dialogAddParticipantsLabel: 'Add Participants',
  inviteParticipantsEmailLabel: 'Email address for Uclusion to send to',
  initiativeManageLabel: 'Manage Initiative',

  // DecisionInvestible
  decisionInvestibleYourVoting: 'Your Vote',
  decisionInvestibleOthersVoting: 'Current Votes',
  decisionInvestibleDescription: 'Description',
  decisionInvestibleDiscussion: 'Discussion',
  decisionInvestibleVotingBlockedMarket: 'Voting is blocked because there is an open issue on the decision',
  decisionInvestibleVotingBlockedInvestible: 'Voting is blocked because there is an open issue',

  // InitiativeInvestible
  initiativeInvestibleVotingBlocked: 'Voting is blocked because there is an open issue',
  initiativeInvestibleYourVoting: 'Your Vote',
  initiativeInvestibleOthersVoting: 'Current Voting',
  initiativeInvestibleDescription: 'Contents',
  initiativeInvestibleDiscussion: 'Discussion',

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

  // Quill Editor
  quillEditorUploadInProgress: 'Uploading image(s)',

  //Planning Manage Users
  manageParticipantsCurrentTitle: 'Current Participants',
  manageParticipantsAddTitle: 'New Participants',
  manageParticipantsMakeObserver: 'Make Approver',
  manageParticipantsMakeParticipant: 'Make Collaborator',
  manageParticipantsHasAsignments: 'Has Assignments',
  manageParticipantsObserver: 'Approver',
  manageParticipantsParticipant: 'Collaborator',

  // decision sidebar
  addOptionLabel: 'Add Option',

  // diff display
  diffDisplayDismissLabel: 'Hide Changes',


  // expiration extender
  deadlineExtenderSave: 'Extend',
  deadlineExtenderCancel: 'Clear',

  // invite linker
  inviteLinkerDirections: 'Share this link to invite others to the dialog',
  inviteLinkerCopyToClipboard: 'Copy to clipboard',

  slackIntegrationSuccessful: 'Slack was successfully integrated.',

  // Assignment List
  assignmentListHeader: 'Assigned to',
  // Address List
  addressListHeader: 'Addressed to',
  addressListMakeObserver: 'Make Yourself an Observer',
  addressListMakeParticipant: 'Make Yourself a Participant',

  // Dialog Archives
  dialogArchivesNotDoingHeader: 'Not Doing',
  dialogArchivesVerifiedHeader: 'Verified',
  dialogArchivesLabel: 'Plan Archives',

  // SignIn
  signInEmailLabel: 'Email',
  signInPasswordLabel: 'Password',
  signInNoAccount: 'Don\'t have an account? Sign up',
  signInForgotPassword: 'Forgot Password?',
  signInSignIn: 'Sign In',


  // Signup
  signupNameLabel: 'Name',
  signupEmailLabel: 'Email',
  signupPasswordLabel: 'Password',
  signupPasswordHelper: '6 Characters Minimum',
  signupPasswordRepeatLabel: 'Repeat Password',
  signupPasswordRepeatHelper: 'Must match Password',
  signupSignupLabel: 'Create Account',
  signupTitle: 'Sign Up',
  signupHaveAccount: 'Already have an account? Sign in',
  signupAccountExists: 'An account with that email already exists, please log in.',
  signupAccountExistsLoginLink: 'Log In',
  signupSentEmail: 'We have sent a verification email to you. Please click the link inside to continue.',
  signupCreatedUser: 'Your user is created, and a verification link has been sent to your email. Please click the link inside to continue.',
  signupResendCodeButton: 'Resend Link',
  signupAgreeTermsOfUse: 'I agree to the Uclusion ',
  signupTermsOfUse: 'Terms of Use',

  // Forgot Password
  forgotPasswordHeader: 'Reset your password',
  forgotPasswordEmailLabel: 'Enter your email address',
  forgotPasswordCodeLabel: 'Reset Code',
  forgotPasswordNewPasswordLabel: 'New Password',
  forgotPasswordRepeatLabel: 'Repeat New Password',
  forgotPasswordSendCodeButton: 'Send Reset Code',
  forgotPasswordResetPasswordButton: 'Submit',
  forgotPasswordResendCode: 'Resend Reset Code',
  forgotPasswordEmailNotFound: 'That email address was not found',
  forgotPasswordInvalidCode: 'An invalid code was entered',
  forgotPasswordHelper: '6 Characters Minimum',
  forgotPasswordRepeatHelper: 'Must match Password',

  // Change Password
  errorChangePasswordFailed: 'Change password failed. Please try again.',
  changePasswordHeader: 'Change your password',
  changePasswordNewLabel: 'New password',
  changePasswordRepeatLabel: 'Repeat new password',
  changePasswordOldLabel: 'Old password',
  changePasswordButton: 'Change Password',

  // Sign out
  signOutButton: 'Sign Out',
  errorSignOutFailed: 'Sign out failed. Please try again.',

  // Change Preferences
  changePreferencesHeader: 'Change your notification preferences',
  emailEnabledLabel: 'Send daily digest of notifications via email',
  slackEnabledLabel: 'Send notifications via Slack',
  changePreferencesButton: 'Update Preferences',

  // your voting
  yourVotingVoteForThisPlanning: 'Vote for this story',
  yourVotingVoteForThisDecision: 'Vote for this option',
  yourVotingVoteForThisInitiative: 'Vote for this',

  // add participants
  addParticipantsNewPerson: 'Need to add someone not on this list?',

  // Spinning
  spinVersionCheckError: 'There was an error checking if the operation was successful. Please reload the page',

  // API errors
  errorDecisionInvestibleAddFailed: 'There was a problem adding the option.',
  errorInvestibleAddFailed: 'There was a problem adding.',
  errorInvestibleDeleteFailed: 'There was a problem deleting.',
  errorPlanningInvestibleAddFailed: 'There was a problem adding the story',
  errorInvestibleStageChangeFailed: 'There was a problem accepting or archiving the assignment',
  errorInvestibleUpdateFailed: 'There was a problem updating the option.',
  errorCommentFetchFailed: 'There was a problem retrieving comments',
  errorCommentSaveFailed: 'There was a problem saving your comment',
  errorInvestmentUpdateFailed: 'There was a problem updating your vote',
  errorAddParticipantsFailed: 'There was a problem adding participants',
  errorInviteParticipantsFailed: 'There was a problem inviting participants',
  errorDecisionAddFailed: 'There was a problem creating your Dialog',
  errorInitiativeAddFailed: 'There was a problem creating your Initiative',
  errorPlanningAddFailed: 'There was a problem creating your Agile Plan',
  errorFileUploadFailed: 'There was a problem uploading your file',
  errorEditLockFailed: 'There was a problem getting permission to edit',
  errorEditLockReleaseFailed: 'There was a problem releasing edit permission',
  errorSubmitToModeratorFailed: 'There was a problem submitting to the moderator',
  errorChangeToObserverFailed: 'There was a problem changing to approver',
  errorChangeToParticipantFailed: 'There was a problem changing to collaborator',
  errorMarketUpdateFailed: 'There was a problem editing the dialog',
  errorMarketExpirationExtendFailed: 'There was a problem extending the deadline',
  errorMarketShowFailed: 'There was a problem restoring the dialog',
  errorMarketHideFailed: 'There was a problem dismissing the dialog',
  errorCommentResolveFailed: 'There was a problem resolving',
  errorCommentReopenFailed: 'There was a problem reopening',
  errorMarketArchiveFailed: 'There was a problem deactivating the dialog',
  errorInvestibleMoveToCurrentVotingFailed: 'There was a problem moving the option to Current Voting',
  errorInvestibleFetchFailed: 'There was a problem receiving the data',
  errorInvestibleListFetchFailed: 'There was a problem fetching the data list',
  errorSignupFailed: 'There was a problem signing up. Please try again',
  errorResendFailed: 'There was a problem resending the link. Please try again',
  errorVerifyFailed: 'There was a problem verifying your email. Please try again',
  errorForgotPasswordCodeFailed: 'There was a problem sending your reset code. Please try again',
  errorForgotPasswordSetFailed: 'There was an error changing your password. Please try again',
  errorClearFailed: 'There was a problem clearing your data. Please try again',
  errorGetIdFailed: 'There was a problem displaying your identification.',
  errorUpdateUserFailed: 'There was a problem updating your profile. Please try again.',
  errorMarketFetchFailed: 'There was an error processing your invite. Please try again.',

  // home cheat sheet
  homeCheatWelcome: 'Welcome to Uclusion!',

  //summary
  summaryExpiredAt: 'Expired on {expireDate}',

  //assigneeFilterDropdown
  assigneeFilterDropdownAll: 'Everyone',
  assigneeFilterLabel: 'Show stories for:',

  // warnings
  warningOffline: 'You are offline',

  // Issue Present
  issuePresent: 'Issue Present',

});

export default messages;
