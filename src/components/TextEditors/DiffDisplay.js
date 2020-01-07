import React, { useContext, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DiffContext } from '../../contexts/DiffContext/DiffContext';
import { getDiff } from '../../contexts/DiffContext/diffContextHelper';
import './DiffDisplay.css';
import { deleteDiff } from '../../contexts/DiffContext/diffContextReducer';
import { Button } from '@material-ui/core';
import { useIntl } from 'react-intl';


function DiffDisplay(props) {

  const ref = useRef(null);
  const intl = useIntl();
  const { id } = props;
  const [diffState, diffDispatch] = useContext(DiffContext);
  const diff = getDiff(diffState, id);

  function onDismiss() {
    diffDispatch(deleteDiff(id));
  }

  useEffect(() => {
    if (ref.current !== null) {
      if (diff) {
        ref.current.innerHTML = diff;
      }
    }
    return () => {
    };
  }, [ref, diff, id]);

  return (
    <div>
      <div ref={ref} />
      <Button
        variant="contained"
        size="small"
        color="primary"
        onClick={onDismiss}
      >
        {intl.formatMessage({ id: 'diffDisplayDismissLabel' })}
      </Button>
    </div>
  );
}

DiffDisplay.propTypes = {
  id: PropTypes.string.isRequired,
};

export default DiffDisplay;
