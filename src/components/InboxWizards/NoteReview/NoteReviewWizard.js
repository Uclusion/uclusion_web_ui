import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import ReviewNoteStep from './ReviewNoteStep';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';

function NoteReviewWizard(props) {
  const { marketId, commentId, message } = props;
  const parentElementId = getMessageId(message);
  return (
    <FormdataWizard name={`note_review_wizard${commentId}`}
                    defaultFormData={{parentElementId, useCompression: true}}>
      <ReviewNoteStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

NoteReviewWizard.propTypes = {
  marketId: PropTypes.string.isRequired,
  commentId: PropTypes.string.isRequired,
  message: PropTypes.object.isRequired
};

export default NoteReviewWizard;
