import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import DiffDisplay from '../TextEditors/DiffDisplay';
import { findMessageOfTypeAndId } from '../../utils/messageUtils'
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import QuillEditor2 from '../TextEditors/QuillEditor2'
import _ from 'lodash'

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
  if (!id || _.isEmpty(description)) {
    return React.Fragment;
  }

  return (
    <div>
      <QuillEditor2
        id={`readOnlyDiff${id}`}
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