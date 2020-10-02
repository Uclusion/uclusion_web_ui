import { createMyInitiative } from '../../components/AddNew/Initiative/initiativeCreator';
import { createMyDialog } from '../../components/AddNew/Dialog/dialogCreator';
import { doCreateRequirementsWorkspace } from '../../components/AddNew/Workspace/RequirementsWorkspace/workspaceCreator';

export function createECPMarkets (dispatchers) {
  let initiativeId = null;
  return createInitiative(dispatchers)
    .then((createdId) => {
      initiativeId = createdId;
      return createDialog(dispatchers);
    }).then(() => createTeamWorkspace(dispatchers))
    .then(() => createProjectWorkspace(dispatchers))
    .then(() => initiativeId);
}

function createInitiative (dispatchers) {
  const initiativeExpiration = 1440 * 14;
  const initiativeName = 'Checkout Uclusion Initiatives';
  const initiativeDescription = '<p>\n' +
    '    Uclusion Initiatives are a great way to measure support for an idea, and are a good introduction to\n' +
    '    <a href="https://www.uclusion.com/autonomousteamwork">autonomous teamwork</a>.\n' +
    '</p>\n' +
    '<p/>\n' +
    '<p>\n' +
    '    Initiatives don\'t require you to make big process changes, and have several features to make sure you get timely\n' +
    '    constructive feedback.\n' +
    '</p>\n' +
    '<p/>\n' +
    '<p>\n' +
    '    Initiatives have a deadline, and collaborators will be notified to respond as it approaches.<br>\n' +
    '    <img src="https://www.uclusion.com/static/media/onboarding/expiry.png" height="200"/>\n' +
    '</p>\n' +
    '<p/>\n' +
    '<p>\n' +
    '    Communication is <em>structured</em> so you always know what a collaborator is trying to say.\n' +
    '    <img src="https://www.uclusion.com/static/media/onboarding/suggestion.png"/>\n' +
    '</p>\n' +
    '<p/>\n' +
    '<p>\n' +
    'Collaborators can vote for or against, fully express how certain they are, and give reasons for their vote.<br/>\n' +
    '<img src="https://www.uclusion.com/static/media/onboarding/initiative_vote.png"/>\n' +
    '</p>\n' +
    '<p/>\n' +
    '<p>\n' +
    '    We present a simple tally on your home page, so you can see how it\'s going at a glance.<br/>\n' +
    '    <img src="https://www.uclusion.com/static/media/onboarding/initiative_outcome.png"/>\n' +
    '</p>\n' +
    '<p/>\n' +
    '<p>\n' +
    '    In short, we eliminate the incessant back and forth on emails, and the uncertainty of weather people really agree with you or not.\n' +
    '</p>\n' +
    '<p>\n' +
    '    <b>With Uclusion, you know exactly where your idea stands at all times.</b>\n' +
    '</p>\n' +
    '<p/>\n' +
    '<p>\n' +
    '    So click on "Manage Collaborators" and send this to your team to get them started too.<br/>\n' +
    '    <img src="https://www.uclusion.com/static/media/onboarding/add_collaborators.png"/>\n' +
    '</p>';
  return createMyInitiative(dispatchers, { initiativeName, initiativeDescription, initiativeExpiration },
    () => {});
}

function createDialog (dispatchers) {
  const dialogExpiration = 1440 * 3;
  const dialogName = 'Your first Dialog';
  const dialogReason = '<p>We created this Dialog for you, so it won\'t count against your free allotment</p>' +
    '<p> Once your team is used to weighing in on a single idea, it’s time to introduce them to Dialogs, by editing this Dialog and sending it to them.</p>' +
    '<p>The same concepts from Initiatives apply, but now they can vote for one or more options, and even propose their own.</p>' +
    '<p>Once everyone is using Dialogs, you have a good chance of avoiding meetings entirely,' +
    ' but if not the options and opinions are known so the meeting will be short.' +
    ' They also serve as ‘Architecture Decision Records’ when you add a link to the Dialog in your\n' +
    '                    code or commit messages.</p>' +
    '<p><br/></p>' +
    'So get to editing, add a few options, and then invite them!';

  return createMyDialog(dispatchers,
    { dialogName, dialogReason, dialogOptions: [], dialogExpiration, addOptionsSkipped: true },
    () => {});
}

function createTeamWorkspace (dispatchers) {
  const workspaceName = 'Your Team Workspace';
  const workspaceDescription = '<p>We created this workspace for your team so you can organize team wide documentation, store onboarding materials, and drive important discussions about team wide topics</p>' +
    '<p>To get started, invite everyone on your team, and have them edit this description as they see fit.</p>';

  return doCreateRequirementsWorkspace(dispatchers, { workspaceName, workspaceDescription });
}

function createProjectWorkspace (dispatchers) {
  const workspaceName = 'Your Small Project Workspace';
  const workspaceDescription = '<p>We created this workspace to help your team to run a small project from start to finish inside Uclusion.</p>' +
  'List all the requirements just like you would do for a wiki, but this time use the comments' +
  ' section to drive discussion.</p>' +
  '<p>You’ll get incremental updates of changes, but won’t be tied to' +
  ' meetings in order to create good requirements and you’ll have Dialogs linked to the Workspace to' +
  ' help make and record any decisions.</p>' +
  '<p>When ready to start work, create stories in the Workspace.</p>' +
  '<p>Each story gets its own discussion section, and the status of that story takes discussion into' +
  ' account, so you won’t need your normal standup meetings.</p>';
  return doCreateRequirementsWorkspace(dispatchers, { workspaceName, workspaceDescription });
}