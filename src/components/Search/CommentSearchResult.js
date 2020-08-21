import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { getCommentRoot } from '../../contexts/CommentsContext/commentsContextHelper'
import { Link, } from '@material-ui/core'
import _ from 'lodash'
import { formCommentLink } from '../../utils/marketIdPathFunctions'
import { useIntl } from 'react-intl'
import {
  ISSUE_TYPE,
  JUSTIFY_TYPE,
  QUESTION_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE
} from '../../constants/comments'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import CardType from '../CardType'


function getIntlMessage (commentType) {
  switch (commentType) {
    case ISSUE_TYPE:
      return 'commentSearchResultIssue';
    case JUSTIFY_TYPE:
      return 'commentSearchResultJustify';
    case QUESTION_TYPE:
      return 'commentSearchResultQuestion';
    case SUGGEST_CHANGE_TYPE:
      return 'commentSearchResultSuggestion';
    case TODO_TYPE:
      return 'commentSearchResultTodo';
    case REPORT_TYPE:
      return 'commentSearchResultReport';
    default:
      console.error('Unknown comment type ' + commentType);
      return '';
  }
}

function CommentSearchResult (props) {
  const {
    marketId,
    commentId,
    classes
  } = props;
  const intl = useIntl();
  const [commentsState] = useContext(CommentsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [marketsState] = useContext(MarketsContext);
  const commentRoot = getCommentRoot(commentsState, marketId, commentId);
  if (_.isEmpty(commentRoot)) {
    return <React.Fragment key={commentId}/>;
  }

  function getMarketName (marketId) {
    const market = getMarket(marketsState, marketId);
    if (_.isEmpty(market)) {
      return '';
    }
    const { name } = market;
    return name;
  }

  function getInvestibleName (investibleId) {
    const inv = getInvestible(investibleState, investibleId);
    if (_.isEmpty(inv)) {
      // falll back to the market at a minimum;
      return getMarketName(marketId);
    }
    const { investible } = inv;
    const { name } = investible;
    return name;
  }

  const { comment_type: type, investible_id: investibleId, id: rootId } = commentRoot;

  const containerName = !_.isEmpty(investibleId) ? getInvestibleName(investibleId) : getMarketName(marketId);
  const messageId = getIntlMessage(type);
  const linkText = intl.formatMessage({ id: messageId }, { name: containerName });
  const linkTarget = formCommentLink(marketId, investibleId, rootId);


  return (
    <Link href={linkTarget} className={classes.link}>
      <CardType
        type={type}
        label={linkText}
        fullWidth
      >
      </CardType>
    </Link>
  );

}

CommentSearchResult.propTypes = {
  marketId: PropTypes.string.isRequired,
  commentId: PropTypes.string.isRequired,
};

export default CommentSearchResult;

