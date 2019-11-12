import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import Screen from '../../containers/Activity/Screen';
import {
  makeBreadCrumbs,
  formMarketLink,
  decomposeMarketPath
} from '../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarket, getMyUserForMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import _ from 'lodash';
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import DecisionInvestible from './Decision/DecisionInvestible';

const emptyInvestible = { investible: { name: '', description: '' } };
const emptyMarket = { name: '' };

function createCommentsHash(commentsArray) {
  return _.keyBy(commentsArray, 'id');
}

function Investible(props) {
  const { hidden } = props;
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  const { marketId, investibleId } = decomposeMarketPath(pathname);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const [marketsState] = useContext(MarketsContext);
  const market = getMarket(marketsState, marketId) || emptyMarket;
  const user = getMyUserForMarket(marketsState, marketId) || {};
  const userId = user.id;
  const [commentsState] = useContext(CommentsContext);
  const comments = getMarketComments(commentsState, marketId);
  const investibleComments = comments.filter((comment) => comment.investible_id === investibleId);
  const commentsHash = createCommentsHash(investibleComments);
  const [investiblesState] = useContext(InvestiblesContext);
  const inv = getInvestible(investiblesState, investibleId) || emptyInvestible; // fallback for initial render
  const { investible } = inv;
  const { name } = investible;
  const breadCrumbTemplates = [{ name: market.name, link: formMarketLink(marketId) }];
  const breadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);


  return (
    <Screen
      title={name}
      breadCrumbs={breadCrumbs}
      hidden={hidden}
    >
      <DecisionInvestible
        userId={userId}
        investibleId={investibleId}
        marketId={marketId}
        investible={investible}
        commentsHash={commentsHash}
        marketPresences={marketPresences}
        investibleComments={investibleComments}
      />
    </Screen>
  );
}

Investible.propTypes = {
  hidden: PropTypes.bool,
};

Investible.defaultProps = {
  hidden: false,
};

export default Investible;