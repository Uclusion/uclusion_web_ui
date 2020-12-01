import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Link, Card } from '@material-ui/core'
import { navigate } from '../../utils/marketIdPathFunctions'
import { useIntl } from 'react-intl'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { getInvestibleName } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { useHistory } from 'react-router'
import Typography from '@material-ui/core/Typography';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import _ from 'lodash'
import { INITIATIVE_TYPE } from '../../constants/markets'


function getTypeNameId() {
  return 'NotificationResultJustify';
}

function VotingNotificationResult(props) {
  const {
    marketId,
    investibleId,
    classes,
    afterOnClick,
    link,
    userId
  } = props;
  console.debug(`userId is ${userId}`);
  const intl = useIntl();
  const history = useHistory();
  const [investibleState] = useContext(InvestiblesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [marketsState] = useContext(MarketsContext);
  const [commentsState] = useContext(CommentsContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const creator = marketPresences.find((presence) => (presence.id === userId));
  const market = getMarket(marketsState, marketId);
  const { parent_comment_market_id: parentMarketId, parent_comment_id: parentCommentId,
    market_type: marketType } = market;
  const inlineComments = getMarketComments(commentsState, parentMarketId) || [];
  const parentComment = inlineComments.find((comment) => comment.id === parentCommentId) || {};
  function getMarketName (marketId) {
    const market = getMarket(marketsState, marketId);
    if (_.isEmpty(market)) {
      return '';
    }
    const { name } = market;
    return name;
  }
  const containerName = marketType === INITIATIVE_TYPE ?
    parentComment.investible_id ? getInvestibleName(parentComment.investible_id, investibleState) :
    parentComment.market_id ? getMarketName(parentComment.market_id) : getMarketName(marketId)
    : getInvestibleName(investibleId, investibleState);
  function getCardClass() {
      return classes.justifyCard;
  }
  const cardClass = getCardClass();
  const typeName = intl.formatMessage({ id: getTypeNameId()});
  const excerpt = (creator || {}).name;

  return (
    <Link href={link} className={classes.link} onClick={
      (event) => {
        event.stopPropagation();
        event.preventDefault();
        navigate(history, link);
        afterOnClick();
      }
    }>
      <Card className={cardClass}>
        <Typography className={classes.commentSearchTitle}>{typeName}</Typography>
        <Typography className={classes.commentSearchName}>{containerName}</Typography>
        <Typography className={classes.commentSearchExcerpt}>
          {intl.formatMessage({id: 'CommentSearchResultExcerpt'}, {excerpt})}</Typography>
      </Card>
    </Link>
  );

}

VotingNotificationResult.propTypes = {
  marketId: PropTypes.string.isRequired,
  investibleId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  afterOnClick: PropTypes.func,
};

VotingNotificationResult.defaultProps = {
  afterOnClick: () => {},
}

export default VotingNotificationResult;

