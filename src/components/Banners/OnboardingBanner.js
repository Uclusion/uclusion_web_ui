import React from 'react';
import { Box, Card, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { makeStyles } from '@material-ui/styles';
import PropTypes from 'prop-types'

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
  };
});

function OnboardingBanner(props) {
  const { messageId } = props;
  const intl = useIntl();
  const classes = useStyles();

  return (
    <div className={classes.bannerBox}>
      <Card className={classes.bannerCard}>
        <Typography>
          <Box fontWeight="bold">
            {intl.formatMessage({ id: messageId })}
          </Box>
        </Typography>
      </Card>
    </div>
  );
}

OnboardingBanner.propTypes = {
  messageId: PropTypes.string.isRequired,
};

export default OnboardingBanner;