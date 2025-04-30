import React from 'react';
import { Typography, useMediaQuery, useTheme } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import DemoCreateWorkspaceButton from '../Buttons/DemoCreateWorkspaceButton';
import Link from '@material-ui/core/Link';
import DismissableText from '../Notifications/DismissableText';

const useStyles = makeStyles((theme) => {
  return {
    bannerBackground: {
      background: 'white',
      paddingBottom: '0.8rem'
    },
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
    }
  };
});

function SwimlanesOnboardingBanner(props) {
  const { group, sectionOpen, isDemo, isAutonomous } = props;
  const classes = useStyles();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));
  const isDemoEngineeringScreen = isDemo && (!sectionOpen || sectionOpen === 'storiesSection') &&
    group?.name === 'Engineering';

  return (
    <div className={classes.bannerBackground} id='bannerId'>
      <div className={classes.bannerBox}>
          <div style={{marginTop: '0.8rem'}} id='swimlanesDemoBannerText'>
            {isDemoEngineeringScreen && (
              <DismissableText textId="everyoneStatusHelp" text={
                <div>
                   <Typography><b>Here is status at a glance for this view.</b></Typography>
                   <Typography className={classes.ctaSub}>
                     Click on anything in red to go to an inbox notification.
                   </Typography>
                 </div>
               }/>
            )}
            {!isDemo && isAutonomous && (
              <DismissableText textId="everyoneStatusHelp" text={
                <div>
                  <Typography>This <Link href="https://documentation.uclusion.com/views/mywork/" target="_blank">My work</Link> view
                  displays all assigned</Typography>
                  <Typography className={classes.ctaSub}>
                    to you even if from another view.
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
                  <Typography>See <Link href="https://documentation.uclusion.com/flows/#self-assigning-bugs" target="_blank">self assigning bugs</Link> flow.</Typography>
                  <Typography className={classes.ctaSub}>
                    Bugs can be quickly created and later moved to tasks in a job.
                  </Typography>
                </div>
              }/>
            )}
            {sectionOpen === 'backlogSection' && !isAutonomous && (
              <DismissableText textId="backlogHelp" text={
                <div>
                  <Typography>See <Link href="https://documentation.uclusion.com/flows/#self-assigning-jobs" target="_blank">self assigning jobs</Link> flow.</Typography>
                  <Typography className={classes.ctaSub}>
                    Creating a "Not Ready" job does not send a notification.
                  </Typography>
                </div>
              }/>
            )}
            {sectionOpen === 'discussionSection' && !isAutonomous && (
              <DismissableText textId="discussionHelp" text={
                <div>
                  <Typography><b>Vote here on new ideas and question options.</b></Typography>
                  <Typography className={classes.ctaSub}>
                    Suggestions can be converted to tasks in a job.
                  </Typography>
                </div>
              }/>
            )}
          </div>
        {!mobileLayout && isDemo && (
          <div style={{ marginTop: '0.8rem' }}>
            <DemoCreateWorkspaceButton/>
          </div>
        )}
      </div>
    </div>
  );
}

export default SwimlanesOnboardingBanner;