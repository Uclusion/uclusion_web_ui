import Typography from '@material-ui/core/Typography'

export function workspaceInvitedUserSteps (variables) {
  const {
    name,
    isCreator
  } = variables;
    const steps = [];
    if (isCreator) {
      steps.push({
        disableBeacon: true,
        target: '#inboxNotification',
        placement: 'bottom',
        content: (
          <Typography style={{textAlign: 'left'}} variant="body2">
            Actions in Uclusion generate notifications that tell everyone what to do.
            <br/><br/>
            You now have a notification to add collaborators to this Workspace that will remain until you do.
          </Typography>
        ),
      });
    } else {
      steps.push({
        disableBeacon: true,
        target: 'body',
        placement: 'center',
        title: `Welcome ${name}!`,
        content: 'Workspaces are where your team collaborates to get things done without meetings.'
      });
    }
    if (document.getElementById('navList')) {
      steps.push({
        disableBeacon: true,
        target: '#navList',
        placement: 'right',
        content: 'The navigation sidebar is a command center for the Workspace. Click its blue icon to learn more.',
      });
    }
    if (!isCreator && document.getElementById('inboxNotification')) {
      steps.push({
        disableBeacon: true,
        target: '#inboxNotification',
        placement: 'bottom',
        content: 'Categorized notifications are automatically sent and appear here so you know what needs to be done when.',
      });
    }
    return steps;
}