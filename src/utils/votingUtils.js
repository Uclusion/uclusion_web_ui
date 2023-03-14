/*
 Given the marketPresences and an investible id
 returns a transformed map of voters for the investible
 */
export function getInvestibleVoters(marketPresences, investibleId) {
  const acc = [];
  marketPresences.forEach(presence => {
    const { name, id, email, investments } = presence;
    (investments || []).forEach(investment => {
      const {
        quantity,
        investible_id: invId,
        comment_id: commentId,
        max_budget: maxBudget,
        max_budget_unit: maxBudgetUnit,
        updated_at: updatedAt,
        deleted
      } = investment;
      if (investibleId === invId && !deleted) {
        acc.push({ name, id, email, quantity, commentId, maxBudget, maxBudgetUnit, updatedAt });
      }
    });
  });
  return acc;
}