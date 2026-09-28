import _ from 'lodash';
import { getFormerStageId } from './commentFunctions';
import { getStages } from '../contexts/MarketStagesContext/marketStagesContextHelper';

/**
 * J-all-488: on a Debatable (Requires Input or Blocked) job, Next stage is where the server returns the
 * job once everything open on it is resolved: its former stage, or Approvable when that is Backlog, the
 * rule getFormerStageId shares with the server. It can be set to Approvable, or to Doable when the job
 * has an assignee. Undefined when the job is not Debatable.
 */
export function nextStageField(currentStage, formerStageId, assigned, marketId, marketStagesState) {
  if (!currentStage?.move_on_comment) {
    return undefined;
  }
  const stages = getStages(marketStagesState, marketId);
  const approvable = stages.find((stage) => stage.allows_investment);
  const doable = stages.find((stage) => stage.assignee_enter_only);
  const value = getFormerStageId(formerStageId, marketId, marketStagesState);
  const choices = [approvable, _.isEmpty(assigned) ? undefined : doable].filter(Boolean)
    .map((stage) => stage.id);
  // The stage the job returns to stays listed so the field can show it, even when it is not a choice.
  const optionIds = value && !choices.includes(value) ? [value, ...choices] : choices;
  return { value: value || '', optionIds };
}
