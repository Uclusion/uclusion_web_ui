import React from 'react'
import PropTypes from 'prop-types'
import useFitText from 'use-fit-text'
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
  const { title } = props;
  const classes = useStyles();
  const { fontSize, ref } = useFitText({ maxFontSize: 200 });

  return (
    <div className={classes.container}>
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
  comments: PropTypes.arrayOf(PropTypes.object),
};

OptionCard.defaultProps = {
  title: '',
  comments: [],
};

export default OptionCard;
