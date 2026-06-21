import React from 'react';

/**
 * T-all-2209 (J-all-326, Q-all-156 O-2): hosts the "edit a comment" modal at the
 * top level (in Root) instead of inside the comment's row in a list. The dialog
 * is keyed by the comment id and looked up from CommentsContext, so it stays open
 * and decoupled even if the task is moved to a different job mid-edit and its row
 * unmounts. `editComment` is `{ marketId, commentId }` while a comment is being
 * edited, otherwise undefined.
 */
export const EditCommentContext = React.createContext({
  editComment: undefined,
  openEditComment: () => {},
  closeEditComment: () => {},
});
