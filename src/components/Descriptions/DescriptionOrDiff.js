import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DiffContext } from '../../contexts/DiffContext/DiffContext';
import {
  getLastSeenContent,
  hasDiff,
  hasUnViewedDiff,
  markContentViewed
} from '../../contexts/DiffContext/diffContextHelper';
import DiffDisplay from '../TextEditors/DiffDisplay';
import ReadOnlyQuillEditor from '../TextEditors/ReadOnlyQuillEditor';
import { useIntl } from 'react-intl';
import { Button } from '@material-ui/core';


function DescriptionOrDiff(props) {
  const {
    id,
    description,
    hidden, // need this to make sure we don't declare something as read that's not visible
  } = props;

  const intl = useIntl();

  const [diffState, diffDispatch] = useContext(DiffContext);
  const hasNewDiff = hasUnViewedDiff(diffState, id);
  const [showDiff, setShowDiff] = useState(false);

  const lastSeenContent = getLastSeenContent(diffState, id);
  const diffAvailable = hasDiff(diffState, id);

  function toggleDiffShow() {
    setShowDiff(!showDiff);
  }

  useEffect(() => {
    const shouldEmit = !hidden && !showDiff && lastSeenContent !== description;
    if (shouldEmit) {
      markContentViewed(diffDispatch, id, description);
    }
    return () => {
    };
  }, [id, description, hidden, showDiff, lastSeenContent, diffDispatch]);

  // we'll override the users selection if they have a diff they haven't seen
  const diffMustBeDisplayed = hasNewDiff || (showDiff && diffAvailable);

  if (diffMustBeDisplayed) {
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
  hidden: PropTypes.bool.isRequired,
  id: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

export default DescriptionOrDiff;