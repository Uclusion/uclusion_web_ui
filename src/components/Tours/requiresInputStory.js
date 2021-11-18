import Typography from '@material-ui/core/Typography'

export function requiresInputStorySteps(variables) {
  const {
    isAssigned, mobileLayout
  } = variables;
    const steps = [];
  if (isAssigned) {
    steps.push({
      disableBeacon: true,
      placement: 'center',
      target: 'body',
      title: 'Welcome to story help!',
      content: (
        <Typography style={{textAlign: 'left'}} variant="body2">
          This story will stay in Requires Input until you or someone else assigned moves it.
          <br/><br/>
          Moving it requires all assignee questions and suggestions be resolved.
        </Typography>
      ),
    });
    if (!mobileLayout) {
      steps.push({
        disableBeacon: true,
        target: '#outboxNotification',
        placement: 'bottom',
        content: (
          <Typography style={{textAlign: 'left'}} variant="body2">
            Your pending question is tracked here.
          </Typography>
        ),
      });
    }
  } else {
    steps.push({
      disableBeacon: true,
      placement: 'center',
      target: 'body',
      title: 'About Requires Input',
      content: (
        <Typography style={{textAlign: 'left'}} variant="body2">
          Please help resolve the open assignee questions and suggestions in this story.
          <br/><br/>
          Once resolved someone assigned to this story must move it to another stage.
        </Typography>
      ),
    });
  }
    return steps;
}