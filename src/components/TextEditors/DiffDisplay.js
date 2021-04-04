import React, { useContext, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DiffContext } from '../../contexts/DiffContext/DiffContext';
import { getDiff, markDiffViewed } from '../../contexts/DiffContext/diffContextHelper';
import './DiffDisplay.css';
import { makeStyles } from '@material-ui/core';
import { FormattedMessage } from 'react-intl'
import SpinningIconLabelButton from '../Buttons/SpinningIconLabelButton'
import { ExpandLess } from '@material-ui/icons'

const useStyles = makeStyles(
  () => {
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
  const { id, showToggle } = props;
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

  function myOnHide(event) {
    markDiffViewed(diffDispatch, id);
    showToggle(event);
  }

  if (!diff) {
    return React.Fragment;
  }

  return (
    <div>
      <div ref={ref} className={classes.diffContainer}/>
      <div style={{marginTop: '1rem'}} />
      <SpinningIconLabelButton icon={ExpandLess} onClick={myOnHide} doSpin={false}>
        <FormattedMessage id="diffDisplayDismissLabel" />
      </SpinningIconLabelButton>
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
