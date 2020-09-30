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
  const initiativeExpiration = 1440;
  const initiativeName = 'Your first Initiative';
  const initiativeDescription = '<p>Initiatives are a tool to build and measure support for an idea, and are a great introduction to ' +
    'autonomous teamwork concepts. They don’t require your team to change any of their current process,' +
    ' and you’ll get feedback without the giant email chains or long discussions that are impossible to control.</p>' +
    '<p>So edit this initiative and send it out to your team members. The content can be as innocuous as proposing a place to eat tomorrow,' +
    'or as important as whether you should replace core architecture.</p>';
  return createMyInitiative(dispatchers, { initiativeName, initiativeDescription, initiativeExpiration },
    () => {});
}

function createDialog (dispatchers) {
  const dialogExpiration = 1440;
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
  const workspaceName = 'Your first Team Workspace';
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