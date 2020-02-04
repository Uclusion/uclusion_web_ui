import React, { useContext, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DiffContext } from '../../contexts/DiffContext/DiffContext';
import { getDiff, markDiffViewed } from '../../contexts/DiffContext/diffContextHelper';
import './DiffDisplay.css';
import { Button } from '@material-ui/core';
import { useIntl } from 'react-intl';


function DiffDisplay(props) {
  const ref = useRef(null);
  const intl = useIntl();
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

  function myOnHide() {
    markDiffViewed(diffDispatch, id);
    showToggle();
  }

  return (
    <div>
      <div ref={ref} />
      <Button
        variant="contained"
        size="small"
        color="primary"
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
