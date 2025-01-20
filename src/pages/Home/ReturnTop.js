import React from 'react';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router';
import { formInvestibleLink, formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import { ArrowBack } from '@material-ui/icons';
import { getInboxTarget } from '../../contexts/NotificationsContext/notificationsContextHelper';
import TooltipIconButton from '../../components/Buttons/TooltipIconButton';
import _ from 'lodash';
import { useHotkeys } from 'react-hotkeys-hook';

function ReturnTop(props) {
  const { action, pathInvestibleId, marketId, groupId, pathMarketIdRaw, hashInvestibleId, isArchivedWorkspace,
    useLink, typeObjectId } = props;
  const intl = useIntl();
  const history = useHistory();
  const isConfigScreen = ['userPreferences', 'integrationPreferences', 'billing'].includes(action);
  const upFromConfigPossible = isConfigScreen && marketId;
  const downLevel = action === 'inbox' ? !_.isEmpty(pathMarketIdRaw) :
    (action === 'wizard' ? !_.isEmpty(groupId || marketId) :
      (action === 'marketEdit' ? marketId : (action === 'groupEdit' ? groupId : !_.isEmpty(pathInvestibleId))));
  const upDisabled = ((!downLevel || !['dialog', 'inbox', 'wizard', 'marketEdit', 'groupEdit'].includes(action))
    &&!upFromConfigPossible)||isArchivedWorkspace;

  function goUp(){
    if (useLink) {
      navigate(history, useLink);
    }else if (upFromConfigPossible) {
      navigate(history, formMarketLink(marketId, marketId));
    } else if (action === 'wizard' && typeObjectId) {
      navigate(history, getInboxTarget());
    } else if (action === 'wizard' && hashInvestibleId) {
      navigate(history, formInvestibleLink(marketId, hashInvestibleId));
    } else if (action === 'marketEdit' || (action === 'wizard' && marketId && !groupId)) {
      navigate(history, formMarketLink(marketId, marketId));
    } else if (groupId) {
      navigate(history, formMarketLink(marketId, groupId));
    } else {
      navigate(history, getInboxTarget());
    }
  }

  useHotkeys('ctrl+arrowUp', goUp, {enabled: !upDisabled, enableOnContentEditable: true},
    [history, useLink, upFromConfigPossible, marketId, action, hashInvestibleId, groupId]);

  return (
    <div style={{marginBottom: '1rem'}}>
      <TooltipIconButton disabled={upDisabled} icon={<ArrowBack htmlColor={upDisabled ? 'disabled' : 'black'}/>}
                         onClick={goUp} translationId="upNavigation">
        <span style={{ paddingLeft: '0.5rem', color: 'black' }}>{intl.formatMessage({ id: 'up' })}</span>
      </TooltipIconButton>
    </div>
  );

}

export default ReturnTop;