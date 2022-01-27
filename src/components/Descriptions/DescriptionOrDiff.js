import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import DiffDisplay from '../TextEditors/DiffDisplay';
import { findMessageOfTypeAndId } from '../../utils/messageUtils'
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import QuillEditor2 from '../TextEditors/QuillEditor2'

function DescriptionOrDiff(props) {
  const {
    id,
    description,
    showDiff
  } = props;

  const [messagesState] = useContext(NotificationsContext);
  const myMessage = findMessageOfTypeAndId(id, messagesState, 'DESCRIPTION');

  if (myMessage && showDiff) {
    return (
      <DiffDisplay
        id={id}
      />
    );
  }
  return (
    <div>
      <QuillEditor2
        id={id}
        value={description}
        noToolbar
      />
    </div>
  );
}

DescriptionOrDiff.propTypes = {
  id: PropTypes.string.isRequired,
  description: PropTypes.string,
  showDiff: PropTypes.bool
};

export default DescriptionOrDiff;