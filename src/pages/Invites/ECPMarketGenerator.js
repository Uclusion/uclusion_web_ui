import { createMyInitiative } from '../../components/AddNew/Initiative/initiativeCreator';
import { createMyDialog } from '../../components/AddNew/Dialog/dialogCreator';
import { doCreateRequirementsWorkspace } from '../../components/AddNew/Workspace/RequirementsWorkspace/workspaceCreator';
import { getRandomSupportUser } from '../../utils/userFunctions'
import { addParticipants } from '../../api/users'

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
  const initiativeDescription = '<p>' +
    '    Uclusion Initiatives are a great way to measure support for an idea, and are a good introduction to' +
    ' <a href="https://www.uclusion.com/autonomousteamwork">autonomous teamwork</a>.' +
    '</p>' +
    '<p/>' +
    '<p>' +
    '    Initiatives have several features to make sure you get timely constructive feedback:' +
    '</p>' +
    '<p/>' +
    '<p>' +
    '    Initiatives have a deadline, and collaborators will be notified to respond as it approaches.<br>' +
    '    <img src="https://www.uclusion.com/static/media/onboarding/expiry.png" height="160"/>' +
    '</p>' +
    '<p/>' +
    '<p>' +
    '    Communication is <em>structured</em> so you always know what a collaborator is trying to say.' +
    '    <img src="https://www.uclusion.com/static/media/onboarding/suggestion.png"/>' +
    '</p>' +
    '<p/>' +
    '<p>' +
    'Your collaborators can vote for or against the idea, express how certain they are, and give reasons for their vote.<br/>' +
    '<img src="https://www.uclusion.com/static/media/onboarding/initiative_vote.png"/>' +
    '</p>' +
    '<p/>' +
    '<p>' +
    '    We present a simple tally on your home page, so you can see how it\'s going at a glance.<br/>' +
    '    <img src="https://www.uclusion.com/static/media/onboarding/initiative_outcome.png"/>' +
    '</p>' +
    '<p/>' +
    '<p/>' +
    '<p>' +
    '    In short, we eliminate the incessant back and forth on emails, and the uncertainty of whether people really agree with you or not.' +
    '</p>' +
    '<p/>' +
    '<p>' +
    '    <b>With Uclusion, you know exactly where your idea stands at all times.</b>' +
    '</p>';
  return createMyInitiative(dispatchers, { initiativeName, initiativeDescription, initiativeExpiration },
    () => {});
}

function createDialog (dispatchers) {
  const dialogExpiration = 1440 * 14;
  const dialogName = 'How should I make decisions with my team?';
  const dialogReason = '<p>This is a free Dialog with a staff member of Uclusion so you can get experience with Dialogs and we can learn more about you.</p><p/>' +
    '<p>Please include other collaborators in this Dialog if you want.</p>';
  const dialogOptions = [{ optionName: 'Stick with current tools', optionDescription: '<p>Approve this option to continue making team decisions with the current tool set.</p>' },
    { optionName: 'Try Uclusion', optionDescription: '<p>Once everyone is using Uclusion Dialogs, you have a good chance of avoiding meetings entirely,' +
        ' but if not the options and opinions will be known and the meeting short.</p><p/>' +
        '<p>Dialogs also serve as ‘Architecture Decision Records’ when you add a link to the Dialog in your code or commit messages.</p><p/>' +
        '<p>See our <a href="https://www.uclusion.com/onboarding">onboarding document</a> for a full explanation of how to start with Initiatives and Dialogs and move on to Uclusion Workspaces.</p>',
      optionDoNotPromote: true }];
  const supportUser = getRandomSupportUser();
  return createMyDialog(dispatchers,
    { dialogName, dialogReason, dialogOptions, dialogExpiration },
    () => {}).then((marketId) => {
    return addParticipants(marketId, [{
      user_id: supportUser.user_id,
      account_id: supportUser.account_id,
      is_observer: false,
    }]);
  });
}

function createTeamWorkspace (dispatchers) {
  const workspaceName = 'A Demonstration Team Workspace';
  const workspaceDescription = '<p>With a team Workspace you can organize team wide documentation, store onboarding materials, and drive important discussions about team wide topics</p><p/>' +
    '<p>You can archive this demo Workspace or invite collaborators and have edit it as you see fit.</p>';
  return doCreateRequirementsWorkspace(dispatchers, { workspaceName, workspaceDescription });
}

function createProjectWorkspace (dispatchers) {
  const workspaceName = 'A Demonstration Project Workspace';
  const workspaceDescription = '<p>With a project Workspace you can describe and complete requirements from start to finish inside Uclusion.</p><p/>' +
  'You can archive this demo Workspace or invite collaborators and try using it for some small project.</p><p/>' +
  '<p>See <iframe allowfullscreen="true" class="ql-video" frameborder="0" src="https://www.youtube.com/embed/v5QdMpnNr2M?showinfo=0"></iframe> for a walk through on using a Workspace for stories.</p>';
  return doCreateRequirementsWorkspace(dispatchers, { workspaceName, workspaceDescription });
}