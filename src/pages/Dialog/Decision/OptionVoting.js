import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import DecisionInvestible from '../../Investible/Decision/DecisionInvestible';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import OptionListItem from '../../../components/Comments/OptionListItem';
import { stripHTML } from '../../../utils/stringFunctions';
import { isNew } from '../../../components/Comments/Options';
import _ from 'lodash';
import { findMessageByInvestmentUserId } from '../../../utils/messageUtils';

function OptionVoting(props) {
  const [marketsState] = useContext(MarketsContext);
  const { marketPresences = [], investibles = [], marketId, comments = [], isAdmin = false, inArchives, isSent, removeActions,
    selectedInvestibleId, setSelectedInvestibleId, isInbox, isInVoting } = props;
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
    const newlyVoted = investors.filter((investor) => !_.isEmpty(findMessageByInvestmentUserId(investor.id, investibleId, messagesState)));
    const highlightList = newlyVoted.map((investor) => investor.id);
    return (
      <OptionListItem id={investibleId} expansionPanel={expansionPanel} isNew={isNew(inv, messagesState)} 
                      removeActions={removeActions} inArchives={inArchives} marketPresences={marketPresences}
                      people={investors} description={description} title={inv.investible.name} isInVoting={isInVoting}
                      questionResolved={inArchives} isAdmin={isAdmin} highlightList={highlightList} marketId={marketId}
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

export default OptionVoting;
