import PlanningInvestibleEdit from '../../Investible/Planning/PlanningInvestibleEdit'
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { removeWorkListItem, workListStyles } from './WorkListItem'
import { Checkbox, FormControlLabel } from '@material-ui/core'
import { updateInvestible } from '../../../api/investibles'
import { notify, onInvestibleStageChange } from '../../../utils/investibleFunctions'
import { UNASSIGNED_TYPE, YELLOW_LEVEL } from '../../../constants/notifications'
import React, { useContext } from 'react'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { useIntl } from 'react-intl'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'

function InvestibleReady(props) {
  const { marketId, stage, fullInvestible, message, market, investibleId, openForInvestment } = props;
  const intl = useIntl();
  const workItemClasses = workListStyles();
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  const isAdmin = myPresence && myPresence.is_admin;
  return (
    <>
      <PlanningInvestibleEdit
        fullInvestible={fullInvestible}
        marketId={marketId}
        marketPresences={marketPresences}
        onSave={(result) => {
          const { fullInvestible } = result;
          refreshInvestibles(investiblesDispatch, () => {}, [fullInvestible]);
          removeWorkListItem(message, workItemClasses.removed, messagesDispatch);
        }}
        isAdmin={isAdmin}
        isAssign={true}
        isReview={false}
        isApprove={false}
        isInbox
      />
      <div style={{paddingTop: '1.25rem'}} />
      <FormControlLabel
        control={
          <Checkbox
            value={openForInvestment}
            disabled={operationRunning || !isAdmin}
            checked={openForInvestment}
            onClick={() => {
              const updateInfo = {
                marketId,
                investibleId,
                openForInvestment: true,
              };
              setOperationRunning(true);
              return updateInvestible(updateInfo).then((fullInvestible) => {
                onInvestibleStageChange(stage, fullInvestible, investibleId, marketId, undefined,
                  undefined, investiblesDispatch, () => {}, marketStagesState,
                  messagesState, messagesDispatch, [UNASSIGNED_TYPE]);
                notify(myPresence.id, investibleId, UNASSIGNED_TYPE, YELLOW_LEVEL, investiblesState, market,
                  messagesDispatch);
                setOperationRunning(false);
              });
            }}
          />
        }
        label={intl.formatMessage({ id: 'readyToStartCheckboxExplanation' })}
      />
    </>
  );
}

export default InvestibleReady;