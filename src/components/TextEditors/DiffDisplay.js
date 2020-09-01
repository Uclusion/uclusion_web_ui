import React, { useContext, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DiffContext } from '../../contexts/DiffContext/DiffContext';
import { getDiff, markDiffViewed } from '../../contexts/DiffContext/diffContextHelper';
import './DiffDisplay.css';
import { Button, makeStyles } from '@material-ui/core';
import { useIntl } from 'react-intl';

const useStyles = makeStyles(
  theme => {
    return {
      diffContainer: {
        '& img' : {
          width: '100%'
        },
        '& p': {
          width: '100%'
        },
        '& div': {
          width: '100%'
        },
        '& span': {
          width: '100%'
        }
      }
    }
  }
)

function DiffDisplay(props) {
  const classes = useStyles();
  const ref = useRef(null);
  const intl = useIntl();
  const { id, showToggle, displayClass } = props;
  const [diffState, diffDispatch] = useContext(DiffContext);
  const diff = getDiff(diffState, id);


  useEffect(() => {
    if (ref.current !== null) {
      if (diff) {
        ref.current.innerHTML = diff;
      }
    }
    return () => {
    };
  }, [ref, diff, id]);

  function myOnHide() {
    markDiffViewed(diffDispatch, id);
    showToggle();
  }

  return (
    <div>
      <div ref={ref} className={classes.diffContainer}/>
      <Button
        className={displayClass}
        onClick={myOnHide}
      >
        {intl.formatMessage({ id: 'diffDisplayDismissLabel' })}
      </Button>
    </div>
  );
}

DiffDisplay.propTypes = {
  id: PropTypes.string.isRequired,
  showToggle: PropTypes.func,
};

DiffDisplay.defaultProps = {
  showToggle: () => {},
};

export default DiffDisplay;
