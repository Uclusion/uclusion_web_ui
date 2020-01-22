import React from 'react';
import { useHistory } from 'react-router';
import { useIntl } from 'react-intl';
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import { createDecision } from '../../api/markets';
import { checkMarketInStorage } from '../../contexts/MarketsContext/marketsContextHelper';
import { addParticipants } from '../../api/users';
import config from '../../config';

function FeatureRequest() {
  const history = useHistory();
  const intl = useIntl();

  function onDone(marketLink) {
    navigate(history, marketLink);
  }

  function handleSave() {
    const addInfo = {
      name: intl.formatMessage({ id: 'featureRequest' }),
      market_type: 'DECISION',
      description: '<h2>Problem</h2><p>Describe the problem you are facing without referring to a solution. Your ideas for solving this problem should be added as options of this Dialog.</p><p><br></p><h2>Impact</h2><p>How often is this problem occurring and for how many within your organization? How time consuming is the work around if any?</p><p><br></p><h2>Urgency</h2><p>Is there any timeline by which having this problem fixed would be especially important?</p>',
      expiration_minutes: 10080,
    };
    return createDecision(addInfo)
      .then((result) => {
        const { market_id: marketId } = result;
        const link = formMarketLink(marketId);
        return addParticipants(marketId, [{
          user_id: config.support_user_id,
          account_id: config.support_account_id,
          is_observer: false,
        }])
          .then(() => ({
            result: link,
            spinChecker: () => checkMarketInStorage(marketId),
          }));
      });
  }

  return (
    <div>
      <SpinBlockingButton
        marketId=""
        variant="contained"
        color="primary"
        onClick={handleSave}
        onSpinStop={onDone}
      >
        {intl.formatMessage({ id: 'createFeatureRequest' })}
      </SpinBlockingButton>
    </div>
  );
}

export default FeatureRequest;
