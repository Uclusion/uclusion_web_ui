import { registerListener } from '../../utils/MessageBusUtils'
import { EXPANDED_CONTROL } from './ExpandedCommentContext'

export const EXPANDED_COMMENT_CHANNEL = 'EXPANDED_COMMENT';

function beginListening (dispatch) {
  registerListener(EXPANDED_COMMENT_CHANNEL, 'commentExpandedListener', (data) => {
    const { payload: message } = data;
    const {
      commentId,
      expanded
    } = message;
    dispatch({ type: EXPANDED_CONTROL, commentId, expanded });
  });
}

export default beginListening;