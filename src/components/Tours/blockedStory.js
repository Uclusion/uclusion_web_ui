import Typography from '@material-ui/core/Typography'

export function blockedStorySteps(variables) {
  const {
    isAssigned
  } = variables;
    const steps = [];
    if (isAssigned) {
      steps.push({
        disableBeacon: true,
        placement: 'center',
        target: 'body',
        title: 'About task blocking',
        content: (
          <Typography style={{textAlign: 'left'}} variant="body2">
            This job will stay in Blocked until you or someone else resolves all blocking issues.
          </Typography>
        ),
      });
    } else {
      steps.push({
        disableBeacon: true,
        placement: 'center',
        target: 'body',
        title: 'Welcome to unblocking!',
        content: (
          <Typography style={{textAlign: 'left'}} variant="body2">
            Please help resolve Blocking issues in this story.
          </Typography>
        ),
      });
    }
    return steps;
}