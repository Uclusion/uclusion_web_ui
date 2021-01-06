import { registerListener } from '../../utils/MessageBusUtils';
import { HIGHLIGHT_ADD } from './HighlightedCommentContext';

export const HIGHLIGHTED_VOTING_CHANNEL = 'HIGHLIGHTED_VOTING';

function beginListening (dispatch) {
  registerListener(HIGHLIGHTED_VOTING_CHANNEL, 'votingHighlightListener', (data) => {
    const { payload: message } = data;
    const {
      level,
      associated_object_id: associatedUserId,
    } = message;
    dispatch({ type: HIGHLIGHT_ADD, associatedUserId, level });
  });
}

export default beginListening;