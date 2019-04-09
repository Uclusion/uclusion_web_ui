
export function formatInvestibles(investibles) {
  return investibles.map((investible) => {
    const newInvestible = { ...investible };
    newInvestible.created_at = new Date(investible.created_at);
    newInvestible.updated_at = new Date(investible.updated_at);
    newInvestible.last_investment_at = new Date(investible.last_investment_at);
    return newInvestible;
  });
}



export function reFormatComments(comments) {
  return comments.map((comment) => {
    const newComment = { ...comment };
    newComment.created_at = new Date(comment.created_at);
    newComment.updated_at = new Date(comment.updated_at);
    return newComment;
  });
}
