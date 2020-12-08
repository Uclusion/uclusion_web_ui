import React from 'react';
import { Box, Button, Card, darken, Typography } from '@material-ui/core';
import { useHistory } from 'react-router';
import { useIntl } from 'react-intl';
import { makeStyles } from '@material-ui/styles';
import { navigate } from '../../utils/marketIdPathFunctions';

const useStyles = makeStyles(() => {
  return {
    bannerBox: {
      marginTop: '1rem',
      textAlign: 'center',
      border: '2px solid #2d9cdb',
      borderRadius: 6,
      marginBottom: '1rem',
    },
    bannerCard: {
      padding: '10px',
      backgroundColor: '#efefef'
    },
    button: {
      backgroundColor: '#2d9cdb',
      color: '#fff',
      fontSize: '12px',
      '&:hover': {
        backgroundColor: darken('#2d9cdb', 0.08)
      },
      '&:focus': {
        backgroundColor: darken('#2d9cdb', 0.24)
      },
    }

  };
});

function UpgradeBanner (props) {

  const history = useHistory();
  const intl = useIntl();
  const classes = useStyles();

  function gotoBilling () {
    navigate(history, '/billing');
  }

  return (
    <div className={classes.bannerBox}>
      <Card className={classes.bannerCard}>
        <Typography>
          <Box fontWeight="bold">
            {intl.formatMessage({ id: 'upgradeBannerText' })}
          </Box>
        </Typography>
        <Button
          className={classes.button}
          onClick={gotoBilling}
        >
          {intl.formatMessage({ id: 'upgradeNow' })}
        </Button>
      </Card>
    </div>
  );
}

export default UpgradeBanner;