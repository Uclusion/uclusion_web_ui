import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import DecisionInvestible from '../../Investible/Decision/DecisionInvestible';
import { getMarket, getMyUserForMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import OptionListItem from '../../../components/Comments/OptionListItem';
import { nameFromDescription } from '../../../utils/stringFunctions';
import { isRead } from '../../../components/Comments/Options';

function OptionVoting(props) {
  const [marketsState] = useContext(MarketsContext);
  const { marketPresences, investibles, marketId, comments, isAdmin, inArchives, isSent, removeActions,
    selectedInvestibleId, setSelectedInvestibleId } = props;
  const [messagesState] = useContext(NotificationsContext);

  const market = getMarket(marketsState, marketId);
  function getOptionListItem(inv) {
    let expansionPanel = undefined;
    const expansionOpen = inv.investible.id === selectedInvestibleId;
    if (expansionOpen) {
      expansionPanel = <DecisionInvestible
        userId={getMyUserForMarket(marketsState, marketId) || ''}
        investibleId={selectedInvestibleId}
        market={market}
        fullInvestible={inv}
        comments={comments}
        marketPresences={marketPresences}
        investibleComments={comments.filter((comment) => comment.investible_id === selectedInvestibleId)}
        isAdmin={isAdmin}
        inArchives={inArchives}
        isSent={isSent}
        removeActions={removeActions}
      />
    }
    const investibleId = inv.investible.id;
    const description = nameFromDescription(inv.investible.description);
    const investors = marketPresences.filter((presence) =>
      presence.investments?.find((investment) => !investment.deleted && investment.investible_id === investibleId));
    return (
      <OptionListItem id={investibleId} expansionPanel={expansionPanel} read={isRead(inv, messagesState)}
                      people={investors} description={description} title={inv.investible.name}
                      questionResolved={inArchives}
                      expandOrContract={() => {
                        if (expansionOpen) {
                          setSelectedInvestibleId(undefined);
                        } else {
                          setSelectedInvestibleId(investibleId);
                        }
                      }} expansionOpen={expansionOpen} />
    )
  }

  const orderedInvestiblesArray = _.orderBy(investibles, [(inv) => {
    return isRead(inv, messagesState) ? 1 : 0;
  }, (inv) => inv.investible.name]);
  return (
    <div>
      {(orderedInvestiblesArray || []).map((fullInvestible) => getOptionListItem(fullInvestible))}
    </div>
  );
}

OptionVoting.propTypes = {
  isAdmin: PropTypes.bool,
  investibles: PropTypes.arrayOf(PropTypes.object),
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  marketId: PropTypes.string.isRequired,
  comments: PropTypes.arrayOf(PropTypes.object),
  inArchives: PropTypes.bool.isRequired,
};

OptionVoting.defaultProps = {
  isAdmin: false,
  investibles: [],
  marketPresences: [],
  comments: []
};

export default OptionVoting;
