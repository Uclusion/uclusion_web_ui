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
            You now have a notification to add collaborators to this Channel that will remain until you do.
          </Typography>
        ),
      });
    } else {
      steps.push({
        disableBeacon: true,
        target: 'body',
        placement: 'center',
        title: `Welcome ${name}!`,
        content: 'Channels are where your team collaborates to get things done without meetings.'
      });
    }
    if (!isCreator) {
      steps.push({
        disableBeacon: true,
        target: '#inboxNotification',
        placement: 'bottom',
        content: 'The inbox allows you to process incoming work and create and switch between channels.',
      });
    }
    return steps;
}