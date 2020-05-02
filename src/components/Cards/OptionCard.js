import React from 'react'
import { FormattedDate, useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import useFitText from 'use-fit-text'
import { Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'

const useStyles = makeStyles({
  container: {
    margin: '20px',
    paddingBottom: "0",
    display: 'grid',
    boxShadow: 'none',
  },
  latestDate: {
    fontSize: 14,
    lineHeight: '18px',
    color: '#3e3e3e',
    marginTop: '2px',
    marginBottom: '10px',
  },
  title: {
    color: '#3e3e3e',
    fontWeight: 'bold',
    display: 'flex',
    maxHeight: '54px',
    alignItems: 'center',
    cursor: 'pointer',
  },
});

function OptionCard(props) {
  const { title, latestDate } = props;
  const classes = useStyles();
  const intl = useIntl();
  const { fontSize, ref } = useFitText({ maxFontSize: 200 });
  const updatedText = intl.formatMessage({
    id: 'decisionDialogInvestiblesUpdatedAt',
  });

  return (
    <div className={classes.container}>
      <Typography
        className={classes.latestDate}
        color="textSecondary"
        gutterBottom
      >
        {updatedText}
        <FormattedDate value={latestDate} />
      </Typography>
      <div
        ref={ref}
        style={{
          fontSize,
        }}
        className={classes.title}
      >
        {title}
      </div>
    </div>
  );
}

OptionCard.propTypes = {
  title: PropTypes.string,
  latestDate: PropTypes.instanceOf(Date),
  comments: PropTypes.arrayOf(PropTypes.object),
};

OptionCard.defaultProps = {
  title: '',
  latestDate: '',
  comments: [],
};

export default OptionCard;
