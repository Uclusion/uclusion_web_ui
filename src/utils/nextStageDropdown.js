// B-all-660: on a Debatable job, Next stage starts at the shared creation_stage_id.
// Disagreement hides the control. Choosing a value rewrites every unresolved
// comment that already has the field.

export function nextStageDropdown(comments, stages) {
  const resolvedIds = new Set(
    (comments || []).filter((comment) => comment.resolved).map((comment) => comment.id)
  );
  const withStage = (comments || []).filter((comment) => {
    if (!comment.creation_stage_id || comment.resolved || comment.deleted) {
      return false;
    }
    return !comment.root_comment_id || !resolvedIds.has(comment.root_comment_id);
  });
  const ids = [...new Set(withStage.map((comment) => comment.creation_stage_id))];
  if (ids.length !== 1) {
    return undefined;
  }
  const currentId = ids[0];
  const doable = (stages || []).find((stage) => stage.assignee_enter_only);
  const approvable = (stages || []).find((stage) => stage.allows_investment);
  const optionIds = [currentId];
  [doable, approvable].forEach((stage) => {
    if (stage && stage.id !== currentId) {
      optionIds.push(stage.id);
    }
  });
  return {
    value: currentId,
    optionIds,
    commentIds: withStage.map((comment) => comment.id),
  };
}
