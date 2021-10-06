import React from 'react'
import { useHistory, useLocation } from 'react-router'
import queryString from 'query-string'
import { navigate } from '../../utils/marketIdPathFunctions'
import DismissableText from '../../components/Notifications/DismissableText'
import StoryWorkspaceWizard from '../../components/AddNew/Workspace/StoryWorkspace/StoryWorkspaceWizard'

function PlanningAdd() {
  const history = useHistory();
  const location = useLocation();
  const { hash } = location;
  const values = queryString.parse(hash);
  const { investibleId: parentInvestibleId, id: parentMarketId } = values;

  function onFinish(formData) {
    const { link } = formData;
    navigate(history, link);
  }
  return (
    <>
      <DismissableText textId={'planningAddHelp'} />
      <StoryWorkspaceWizard parentInvestibleId={parentInvestibleId} parentMarketId={parentMarketId}
                            onFinish={onFinish} />
    </>
  );
}

export default PlanningAdd;
