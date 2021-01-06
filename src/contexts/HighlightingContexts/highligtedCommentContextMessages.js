import { registerListener } from '../../utils/MessageBusUtils'
import { HIGHLIGHT_ADD } from './HighlightedCommentContext'

export const HIGHLIGHTED_COMMENT_CHANNEL = 'HIGHLIGHTED_COMMENT';

function beginListening (dispatch) {
  registerListener(HIGHLIGHTED_COMMENT_CHANNEL, 'commentHighlightListener', (data) => {
    const { payload: message } = data;
    const {
      level,
      comment_id: commentId,
      investible_id: investibleId
    } = message;
    dispatch({ type: HIGHLIGHT_ADD, commentId: commentId || investibleId, level });
  });
}

export default beginListening;