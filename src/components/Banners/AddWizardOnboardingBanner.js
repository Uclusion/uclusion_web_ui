import React from 'react';
import { Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import Link from '@material-ui/core/Link';
import { COMPOSE_WIZARD_TYPE } from '../../constants/markets';

const useStyles = makeStyles(() => {
  return {
    bannerBackground: {
      background: 'white',
      paddingBottom: '0.8rem'
    },
    bannerBox: {
      '& button': {
        fontWeight: 'bold'
      },
      width: '70%',
      display: 'flex',
      justifyContent: 'space-around'
    },
    ctaSub: {
      fontWeight: 'normal',
    }
  };
});

function AddWizardOnboardingBanner(props) {
  const { createType } = props;
  const classes = useStyles();

  if (createType !== COMPOSE_WIZARD_TYPE.toLowerCase()) {
    return React.Fragment;
  }

  return (
    <div className={classes.bannerBackground}>
      <div className={classes.bannerBox}>
          <div style={{marginTop: '0.8rem'}} id='composeDemoBannerText'>
            <Typography><b>Enjoying the demo?</b> A <Link href="https://documentation.uclusion.com/workspaces" target="_blank">workspace</Link> is
            the place for all developer communication and everyone in it can see all contents.</Typography>
            <Typography className={classes.ctaSub}>
              A job is the only assignable workspace type and also the only one that can contain
              all <Link href="https://documentation.uclusion.com/structured-comments" target="_blank">structured comments</Link>.
            </Typography>
          </div>
      </div>
    </div>
  );
}


export default AddWizardOnboardingBanner;