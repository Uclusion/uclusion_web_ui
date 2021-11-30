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
            This task will stay in Blocked until you or someone else assigned moves it.
            <br/><br/>
            Moving it requires all blocking issues be resolved first.
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
            Please help resolve Blocking Issues in this story.
            <br/><br/>
            Once resolved someone assigned to this story must move it to another stage.
          </Typography>
        ),
      });
    }
    return steps;
}