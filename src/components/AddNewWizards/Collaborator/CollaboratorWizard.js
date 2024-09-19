import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { WizardStylesProvider } from '../WizardStylesContext'
import FormdataWizard from 'react-formdata-wizard'
import { extractUsersList } from '../../../utils/userFunctions';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import _ from 'lodash'
import FromOtherWorkspacesStep from './FromOtherWorkspacesStep';
import InviteByEmailStep from './InviteByEmailStep';
import InviteByEmailConfirmationStep from './InviteByEmailConfirmationStep';

function CollaboratorWizard (props) {
  const { marketId } = props;
  const history = useHistory();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [marketState] = useContext(MarketsContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const participants = Object.values(extractUsersList(marketPresencesState, marketState, marketPresences));

  const onFinish = () => {
    navigate(history, formMarketLink(marketId, marketId));
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name="collaborator_wizard" onFinish={onFinish} useLocalStorage={false}>
        {!_.isEmpty(participants) && (
          <FromOtherWorkspacesStep marketId={marketId} participants={participants}/>
        )}
        <InviteByEmailStep marketId={marketId}/>
        <InviteByEmailConfirmationStep marketId={marketId}/>
      </FormdataWizard>
    </WizardStylesProvider>
  )
}

CollaboratorWizard.propTypes = {
  onboarding: PropTypes.bool,
  onFinish: PropTypes.func,
  onStartOnboarding: PropTypes.func,
}

CollaboratorWizard.defaultProps = {
  onboarding: false,
  onFinish: () => {},
  onStartOnboarding: () => {},
}

export default CollaboratorWizard

