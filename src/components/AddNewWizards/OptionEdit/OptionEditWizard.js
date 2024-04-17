import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import OptionUnlockStep from './OptionUnlockStep';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import OptionEditStep from './OptionEditStep';
import _ from 'lodash';
import { usePresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { getComment } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';

function OptionEditWizard(props) {
  const { marketId, investibleId } = props;
  const [investibleState] = useContext(InvestiblesContext);
  const [marketsState] = useContext(MarketsContext);
  const [commentsState] = useContext(CommentsContext);
  const [wasUnlocked, setWasUnlocked] = useState(undefined);
  const presences = usePresences(marketId);
  const inv = getInvestible(investibleState, investibleId) || {};
  const { investible } = inv;
  const { locked_by: lockedBy } = investible || {};
  const myPresence = presences.find((presence) => presence.current_user);
  const needsLock = lockedBy !== myPresence?.id && !_.isEmpty(lockedBy);
  const market = getMarket(marketsState, marketId);
  const { parent_comment_id: parentCommentId, parent_comment_market_id: parentMarketId } = market;
  const parentComment = getComment(commentsState, parentMarketId, parentCommentId);

  if (_.isEmpty(investible) || _.isEmpty(myPresence) || _.isEmpty(parentComment)) {
    return React.Fragment;
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`option_edit_wizard${investibleId}`} useLocalStorage={false}
                      defaultFormData={{useCompression: true}}>
        {(needsLock || (!_.isEmpty(wasUnlocked) && wasUnlocked === lockedBy)) && (
          <OptionUnlockStep marketId={marketId} investible={investible} parentComment={parentComment}
                            onFinishUnlock={() => setWasUnlocked(myPresence.id)} />
        )}
        {(_.isEmpty(wasUnlocked) || !needsLock) && (
          <OptionEditStep marketId={marketId} investible={investible} parentComment={parentComment} />
        )}
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

OptionEditWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

OptionEditWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default OptionEditWizard;

