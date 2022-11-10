import React from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(() => {
  return {
    title: {
      margin: '1rem 0'
    },
    stepCounter: {
      fontWeight: 400,
    },
  };
});

function StepHeaders (props) {
  const { currentStep, totalSteps, hideSteppers, titleId } = props;
  const intl = useIntl();
  const classes = useStyles();
  const oneIndexedCurrentStep = currentStep + 1;

  return (
    <div>
      {!hideSteppers && <Typography
        className={classes.stepCounter}
        variant="caption">
        {intl.formatMessage({ id: 'StepHeadersStepCount' }, { currentStep: oneIndexedCurrentStep, totalSteps })}
      </Typography>}
      {titleId && (
        <Typography className={classes.title} variant="h4">{intl.formatMessage({ id: titleId })}</Typography>
      )}
    </div>
  );
}

StepHeaders.propTypes = {
  titleId: PropTypes.string,
  hideSteppers: PropTypes.bool,
  currentStep: PropTypes.number.isRequired,
  totalSteps: PropTypes.number.isRequired,
};

StepHeaders.defaultProps = {
  hideSteppers: false,
};

export default StepHeaders;