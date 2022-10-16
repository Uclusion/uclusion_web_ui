import Typography from '@material-ui/core/Typography'

export function requiresInputStorySteps(variables) {
  const {
    isAssigned
  } = variables;
    const steps = [];
  if (isAssigned) {
    steps.push({
      disableBeacon: true,
      placement: 'center',
      target: 'body',
      title: 'Welcome to job help!',
      content: (
        <Typography style={{textAlign: 'left'}} variant="body2">
          This job shows in Assistance until someone resolves your questions and suggestions.
        </Typography>
      ),
    });
  } else {
    steps.push({
      disableBeacon: true,
      placement: 'center',
      target: 'body',
      title: 'About Requires Input',
      content: (
        <Typography style={{textAlign: 'left'}} variant="body2">
          Please help resolve the open assignee questions and suggestions in this job.
        </Typography>
      ),
    });
  }
    return steps;
}