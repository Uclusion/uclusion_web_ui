import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DiffContext } from '../../contexts/DiffContext/DiffContext';
import {
  hasDiff,
  hasUnViewedDiff, markContentViewed,
} from '../../contexts/DiffContext/diffContextHelper'
import DiffDisplay from '../TextEditors/DiffDisplay';
import ReadOnlyQuillEditor from '../TextEditors/ReadOnlyQuillEditor';
import { useIntl } from 'react-intl';
import { Button } from '@material-ui/core';


function DescriptionOrDiff(props) {
  const {
    id,
    description,
  } = props;

  const intl = useIntl();

  const [diffState, diffDispatch] = useContext(DiffContext);
  const hasNewDiff = hasUnViewedDiff(diffState, id);
  const [showDiff, setShowDiff] = useState(false);
  const diffAvailable = hasDiff(diffState, id);

  function toggleDiffShow() {
    markContentViewed(diffDispatch, id, description);
    setShowDiff(!showDiff);
  }

  useEffect(() => {
    if (hasNewDiff) {
      setShowDiff(true);
    }
    return () => {
    };
  }, [hasNewDiff]);


  if (showDiff && diffAvailable) {
    return (
      <DiffDisplay
        id={id}
        showToggle={toggleDiffShow}
      />
    );
  }
  return (
    <div>
      <ReadOnlyQuillEditor
        value={description}
      />
      {diffAvailable && (
        <Button
          onClick={toggleDiffShow}
        >
          {intl.formatMessage({ id: 'diffDisplayShowLabel' })}
        </Button>
      )}
    </div>
  );
}

DescriptionOrDiff.propTypes = {
  id: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

export default DescriptionOrDiff;