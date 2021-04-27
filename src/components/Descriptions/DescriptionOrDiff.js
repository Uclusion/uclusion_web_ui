import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import DiffDisplay from '../TextEditors/DiffDisplay';
import ReadOnlyQuillEditor from '../TextEditors/ReadOnlyQuillEditor';
import { findMessageOfTypeAndId } from '../../utils/messageUtils'
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'

function DescriptionOrDiff(props) {
  const {
    id,
    description,
    setBeingEdited,
    isEditable,
    showDiff
  } = props;

  const [messagesState] = useContext(NotificationsContext);
  const myMessage = findMessageOfTypeAndId(id, messagesState);

  if (myMessage && showDiff) {
    return (
      <DiffDisplay
        id={id}
      />
    );
  }
  return (
    <div>
      <ReadOnlyQuillEditor
        value={description}
        setBeingEdited={setBeingEdited}
        isEditable={isEditable}
      />
    </div>
  );
}

DescriptionOrDiff.propTypes = {
  id: PropTypes.string.isRequired,
  description: PropTypes.string
};

export default DescriptionOrDiff;