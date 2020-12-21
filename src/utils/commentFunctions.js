import _ from 'lodash'
import { addInvestible } from '../contexts/InvestibesContext/investiblesContextHelper'

export function scrollToCommentAddBox() {
  const box = document.getElementById('cabox');
  if (box) {
    box.scrollIntoView();
  }
}

export function changeInvestibleStageOnCommentChange(investibleBlocks, investibleRequiresInput,
  blockingStage, requiresInputStage, info, market_infos, rootInvestible, investibleDispatch) {
  if (investibleBlocks || investibleRequiresInput) {
    const newStage = investibleBlocks ? blockingStage : requiresInputStage;
    if (newStage.id) {
      const newInfo = {
        ...info,
        stage: newStage.id,
        stage_name: newStage.name,
        open_for_investment: false,
        last_stage_change_date: Date.now().toString(),
      };
      const newInfos = _.unionBy([newInfo], market_infos, 'id');
      const newInvestible = {
        investible: rootInvestible,
        market_infos: newInfos
      };
      // no diff here, so no diff dispatch
      addInvestible(investibleDispatch, ()=> {}, newInvestible);
    }
  }
}