import { createMyInitiative } from '../../components/AddNew/Initiative/initiativeCreator';
import { createMyDialog } from '../../components/AddNew/Dialog/dialogCreator';
import { doCreateRequirementsWorkspace } from '../../components/AddNew/Workspace/RequirementsWorkspace/workspaceCreator';
import { getRandomSupportUser } from '../../utils/userFunctions'
import { addParticipants } from '../../api/users'
import { addPlanningInvestible } from '../../api/investibles'
import { addInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { processTextAndFilesForSave } from '../../api/files'

export function createECPMarkets (dispatchers) {
  let initiativeId = null;
  return createInitiative(dispatchers)
    .then((createdId) => {
      initiativeId = createdId;
      return createProjectWorkspace(dispatchers);
    }).then(() => initiativeId);
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
    '    <img src="https://www.uclusion.com/onboardingImages/initiatives/expiry.png" height="160"/>' +
    '</p>' +
    '<p/>' +
    '<p>' +
    '    Communication is <em>structured</em> so you always know what a collaborator is trying to say.' +
    '    <img src="https://www.uclusion.com/onboardingImages/initiatives/suggestion.png"/>' +
    '</p>' +
    '<p/>' +
    '<p>' +
    'Your collaborators can vote for or against the idea, express how certain they are, and give reasons for their vote.<br/>' +
    '<img src="https://www.uclusion.com/onboardingImages/initiatives/initiative_vote.png"/>' +
    '</p>' +
    '<p/>' +
    '<p>' +
    '    We present a simple tally on your home page, so you can see how it\'s going at a glance.<br/>' +
    '    <img src="https://www.uclusion.com/onboardingImages/initiatives/initiative_outcome.png"/>' +
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

function createProjectWorkspace (dispatchers) {
  const workspaceName = 'A Demonstration Project Workspace';
  const workspaceDescription = '<p>Some ideas for getting started with Uclusion.</p><p/>' +
  '<p>See <iframe allowfullscreen="true" class="ql-video" frameborder="0" src="https://www.youtube.com/embed/v5QdMpnNr2M?showinfo=0"></iframe> for a walk through on using a Workspace for stories.</p>';
  return doCreateRequirementsWorkspace(dispatchers, { workspaceName, workspaceDescription }).then((marketDetails) => {
    const {
      market,
      presence,
    } = marketDetails;
    const marketId = market.id;
    const userId = presence.id;
    const processed = processTextAndFilesForSave([], 'Archive this demo Workspace or invite collaborators and try using it for some small project.');
    // add the story
    const processedStoryDescription = processed.text ? processed.text : ' ';
    const addInfo = {
      marketId: marketId,
      name: 'Demo cleanup',
      description: processedStoryDescription,
      uploadedFiles: processed.uploadedFiles,
      assignments: [userId],
    };
    return addPlanningInvestible(addInfo).then((addedStory) => {
      const {
        investiblesDispatch,
        diffDispatch,
      } = dispatchers;
      return addInvestible(investiblesDispatch, diffDispatch, addedStory);
    });
  });
}