import React from 'react';
import { Typography, useMediaQuery, useTheme } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import DemoCreateWorkspaceButton from '../Buttons/DemoCreateWorkspaceButton';
import Link from '@material-ui/core/Link';
import DismissableText from '../Notifications/DismissableText';

const useStyles = makeStyles((theme) => {
  return {
    bannerBox: {
      '& button': {
        fontWeight: 'bold'
      },
      display: 'flex',
      justifyContent: 'space-around',
      [theme.breakpoints.down('sm')]: {
        marginLeft: '0.5rem',
      }
    },
    ctaSub: {
      fontWeight: 'normal',
      marginBottom: '1rem'
    }
  };
});

function SwimlanesOnboardingBanner(props) {
  const { group, sectionOpen, isDemo, isAutonomous } = props;
  const classes = useStyles();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));
  const isSwimlanes = !sectionOpen || sectionOpen === 'storiesSection';
  const isDemoEngineeringScreen = isDemo && isSwimlanes && group?.name === 'Engineering';

  if (mobileLayout) {
    // If there are on mobile the onboarding is over
    return React.Fragment;
  }

  return (
    <div className={classes.bannerBox}>
        <div style={{marginTop: '0.8rem'}} id='swimlanesDemoBannerText'>
          {isDemoEngineeringScreen && (
            <div>
               <Typography><b>This is status at a glance for this view.</b></Typography>
               <Typography className={classes.ctaSub}>
                 Click on anything in red to go to an inbox notification.
               </Typography>
             </div>
          )}
          {isAutonomous && isSwimlanes && (
            <DismissableText textId="everyoneStatusHelp" text={
              <div>
                <Typography>This <Link href="https://documentation.uclusion.com/views/mywork/" target="_blank">My Work</Link> view
                displays all assigned</Typography>
                <Typography className={classes.ctaSub}>
                  or ready for assignment even if from another view.
                </Typography>
              </div>
            }/>
          )}
          {(!sectionOpen || sectionOpen === 'storiesSection') && !isAutonomous && isDemo &&
            group?.name === 'Marketing' && (
            <DismissableText textId="notEveryoneStatusHelp" text={
              <div>
                <Typography><b>This view has its own status.</b></Typography>
                <Typography className={classes.ctaSub}>
                  If you're not a member of this view, you only receive notifications if mentioned.
                </Typography>
              </div>
            }/>
          )}
          {sectionOpen === 'marketTodos' && (
            <DismissableText textId="bugsHelp" text={
              <div>
                <Typography>
                  <Link href="https://documentation.uclusion.com/flows/#self-assigning-bugs" target="_blank">Bugs</Link> can
                  be quickly created
                </Typography>
                <Typography className={classes.ctaSub}>
                  and later moved to tasks in a job.
                </Typography>
              </div>
            }/>
          )}
          {sectionOpen === 'backlogSection' && !isAutonomous && (
            <DismissableText textId="backlogHelp" text={
              <div>
                <Typography>Only "Ready to Assign"  <Link href="https://documentation.uclusion.com/flows/#self-assigning-jobs" target="_blank">jobs</Link> show</Typography>
                <Typography className={classes.ctaSub}>
                  in the Next / Assistance display.
                </Typography>
              </div>
            }/>
          )}
          {sectionOpen === 'discussionSection' && !isAutonomous && (
            <DismissableText textId="discussionHelp" text={
              <div>
                <Typography><b>Vote here on new ideas and question options or add notes.</b></Typography>
                <Typography className={classes.ctaSub}>
                  Suggestions can be converted to tasks in a job.
                </Typography>
              </div>
            }/>
          )}
        </div>
      {isDemo && (
        <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
          <DemoCreateWorkspaceButton/>
        </div>
      )}
    </div>
  );
}

export default SwimlanesOnboardingBanner;