import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { getComment, getCommentRoot } from '../../contexts/CommentsContext/commentsContextHelper';
import { Link, Card } from '@material-ui/core'
import _ from 'lodash'
import { formCommentLink, navigate } from '../../utils/marketIdPathFunctions'
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
import { useHistory } from 'react-router'
import Typography from '@material-ui/core/Typography';


function getTypeNameId (commentType) {
  switch (commentType) {
    case ISSUE_TYPE:
      return 'CommentSearchResultIssue';
    case JUSTIFY_TYPE:
      return 'CommentSearchResultJustify';
    case QUESTION_TYPE:
      return 'CommentSearchResultQuestion';
    case SUGGEST_CHANGE_TYPE:
      return 'CommentSearchResultSuggestion';
    case TODO_TYPE:
      return 'CommentSearchResultTodo';
    case REPORT_TYPE:
      return 'CommentSearchResultProgress';
    default:
      console.error('Unknown comment type ' + commentType);
      return '';
  }
}

function CommentSearchResult (props) {
  const {
    marketId,
    commentId,
    classes,
    afterOnClick,
    link
  } = props;
  const intl = useIntl();
  const history = useHistory();
  const [commentsState] = useContext(CommentsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [marketsState] = useContext(MarketsContext);
  const commentRoot = getCommentRoot(commentsState, marketId, commentId);
  const comment = getComment(commentsState, marketId, commentId);
  const { body } = comment;
  const strippedBody =  !body? '' : body.replace(/(<([^>]+)>)/gi, "");
  const excerpt = !body? '' : strippedBody.substr(0, Math.min(body.length, 20));
  if (_.isEmpty(commentRoot)) {
    return <React.Fragment key={commentId}/>;
  }

  const { comment_type: type, investible_id: investibleId, id: rootId } = commentRoot;

  function getCardClass() {
    switch (type) {
      case ISSUE_TYPE:
        return classes.issueCard;
      case JUSTIFY_TYPE:
        return classes.justifyCard;
      case QUESTION_TYPE:
        return classes.questionCard;
      case SUGGEST_CHANGE_TYPE:
        return classes.suggestionCard;
      case TODO_TYPE:
        return classes.todoCard;
      case REPORT_TYPE:
        return classes.reportCard;
      default:
        console.error('Unknown comment type ' + type);
        return ''
    }
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



  const containerName = !_.isEmpty(investibleId) ? getInvestibleName(investibleId) : getMarketName(marketId);
  const cardClass = getCardClass();
  const typeName = intl.formatMessage({ id: getTypeNameId(type)})
  //const subTitle = intl.formatMessage({ id: 'CommentSearchResultSubTitle' }, { name: containerName });
  const linkTarget = link ? link : formCommentLink(marketId, investibleId, rootId);

  return (
    <Link href={linkTarget} className={classes.link} onClick={
      (event) => {
        event.stopPropagation();
        event.preventDefault();
        navigate(history, linkTarget);
        afterOnClick();
      }
    }>
      <Card className={cardClass}>
        <Typography className={classes.commentSearchTitle}>{typeName}</Typography>
        <Typography className={classes.commentSearchName}>{containerName}</Typography>
        <Typography className={classes.commentSearchExcerpt}>{intl.formatMessage({id: 'CommentsSearchResultExceprt'}, {excerpt})}</Typography>
      </Card>
    </Link>
  );

}

CommentSearchResult.propTypes = {
  marketId: PropTypes.string.isRequired,
  commentId: PropTypes.string.isRequired,
  link: PropTypes.string,
  afterOnClick: PropTypes.func,
};

CommentSearchResult.defaultProps = {
  afterOnClick: () => {},
  link: undefined
}

export default CommentSearchResult;

