import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import { INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets';
import { Link, Card } from '@material-ui/core';
import { formInvestibleLink, navigate } from '../../utils/marketIdPathFunctions'
import { getInvestible, getInvestibleName } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { useHistory } from 'react-router'
import Typography from '@material-ui/core/Typography';
import { useIntl } from 'react-intl';
import MarketSearchResult from './MarketSearchResult';
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'


function InvestibleSearchResult (props) {
  const { investibleId, classes, afterOnClick, link } = props;
  const [marketsState] = useContext(MarketsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const history = useHistory();
  const intl = useIntl();
  const inv = getInvestible(investibleState, investibleId);
  // we're going to assume the first info is what we want
  const { investible: { name }, market_infos: [firstInfo,] } = inv;
  const { market_id: marketId } = firstInfo;
  const market = getMarket(marketsState, marketId);
  const { market_type: marketType, name: marketName, parent_comment_market_id: parentMarketId,
    parent_comment_id: parentCommentId} = market;
  const [commentsState] = useContext(CommentsContext);
  const inlineComments = getMarketComments(commentsState, parentMarketId || marketId) || [];
  const parentComment = inlineComments.find((comment) => comment.id === parentCommentId) || {};
  const parentInv = parentComment.investible_id ? getInvestibleName(parentComment.investible_id, investibleState) : undefined;
  const linkTarget = link ? link : formInvestibleLink(marketId, investibleId);
  const cardTypeId = marketType === PLANNING_TYPE? 'InvestibleSearchResultStory' : 'InvestibleSearchResultOption';
  const cardType = intl.formatMessage({ id: cardTypeId});
  const parentName = parentInv ? parentInv.name : marketName;
  // Initiative investibles are really the market, so render it as such
  if (marketType === INITIATIVE_TYPE) {
    return <MarketSearchResult marketId={marketId} initiativeName={name} {...props}/>
  }

  return (
    <Link
      href={linkTarget}
      className={classes.link}
      onClick={
        (event) => {
          event.stopPropagation();
          event.preventDefault();
          navigate(history, linkTarget);
          afterOnClick();
        }
      }
    >
      <Card className={classes.investibleCard}>
        <Typography className={classes.investibleSearchTitle}>{
          intl.formatMessage({ id: 'InvestibleSearchResultTitle'},
            {type: cardType, parentName})}</Typography>
        <Typography className={classes.investibleSearchName}>{name}</Typography>
      </Card>
    </Link>
  );

}

InvestibleSearchResult.propTypes = {
  investibleId: PropTypes.string.isRequired,
  link: PropTypes.string,
  afterOnClick: PropTypes.func,
};

InvestibleSearchResult.defaultProps = {
  afterOnClick: () => {},
  link: undefined
}

export default InvestibleSearchResult;