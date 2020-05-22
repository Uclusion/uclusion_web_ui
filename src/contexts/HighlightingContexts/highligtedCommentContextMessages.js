import { registerListener } from '../../utils/MessageBusUtils'
import { HIGHTLIGHT_ADD } from './HighlightedCommentContext'

export const HIGHLIGHTED_COMMENT_CHANNEL = 'HIGHLIGHTED_COMMENT';

function beginListening (dispatch) {
  registerListener(HIGHLIGHTED_COMMENT_CHANNEL, 'commentHighlightListener', (data) => {
    const { payload: message } = data;
    const {
      level,
      commentId,
      associatedInvestibleId
    } = message;
    dispatch({ type: HIGHTLIGHT_ADD, commentId: commentId || associatedInvestibleId, level });
  });
}

export default beginListening;