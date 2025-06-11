import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import DecisionInvestible from '../../Investible/Decision/DecisionInvestible';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import OptionListItem from '../../../components/Comments/OptionListItem';
import { stripHTML } from '../../../utils/stringFunctions';
import { isNew } from '../../../components/Comments/Options';

function OptionVoting(props) {
  const [marketsState] = useContext(MarketsContext);
  const { marketPresences, investibles, marketId, comments, isAdmin, inArchives, isSent, removeActions,
    selectedInvestibleId, setSelectedInvestibleId, isInbox } = props;
  const [messagesState] = useContext(NotificationsContext);
  const myPresence = marketPresences.find((presence) => presence.current_user);
  const userId = myPresence?.id;

  const market = getMarket(marketsState, marketId);
  function getOptionListItem(inv) {
    let expansionPanel = undefined;
    const expansionOpen = inv.investible.id === selectedInvestibleId;
    const investibleId = inv.investible.id;
    if (expansionOpen) {
      expansionPanel = <DecisionInvestible
        userId={userId}
        market={market}
        fullInvestible={inv}
        marketPresences={marketPresences}
        investibleComments={comments.filter((comment) => comment.investible_id === investibleId)}
        isAdmin={isAdmin}
        inArchives={inArchives}
        isSent={isSent}
        isInbox={isInbox}
        removeActions={removeActions}
      />
    }
    const description = stripHTML(inv.investible.description);
    const investors = marketPresences.filter((presence) =>
      presence.investments?.find((investment) => !investment.deleted && investment.investible_id === investibleId));
    return (
      <OptionListItem id={investibleId} expansionPanel={expansionPanel} isNew={isNew(inv, messagesState)}
                      people={investors} description={description} title={inv.investible.name}
                      questionResolved={inArchives} isAdmin={isAdmin}
                      expandOrContract={() => {
                        if (expansionOpen) {
                          setSelectedInvestibleId(undefined);
                        } else {
                          setSelectedInvestibleId(investibleId);
                        }
                      }} expansionOpen={expansionOpen} />
    )
  }

  return (
    <div>
      {(investibles || []).map((fullInvestible) => getOptionListItem(fullInvestible))}
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
