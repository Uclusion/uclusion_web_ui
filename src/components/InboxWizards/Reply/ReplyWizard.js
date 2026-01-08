import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideReplyStep from './DecideReplyStep';
import OtherOptionsStep from './OtherOptionsStep';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';
import { getMarketInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import DisplayMarketStep from './DisplayMarketStep';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { getCommentRoot } from '../../../contexts/CommentsContext/commentsContextHelper';
import _ from 'lodash';

function ReplyWizard(props) {
  const { marketId, commentId, message } = props;
  const  parentElementId = getMessageId(message);
  const [investiblesState] = useContext(InvestiblesContext);
  const [commentsState] = useContext(CommentsContext);
  const commentRoot = getCommentRoot(commentsState, marketId, commentId);
  const inlineMarketId = commentRoot?.inline_market_id;
  const inlineInvestibles = getMarketInvestibles(investiblesState, inlineMarketId, undefined, true) || [];
  const hasInlineMarket = !_.isEmpty(inlineInvestibles);

  if (_.isEmpty(commentRoot)) {
    return React.Fragment;
  }

  return (
    <FormdataWizard name={`reply_wizard${commentId}`} defaultFormData={{parentElementId, useCompression: true}}>
      {hasInlineMarket && (
        <DisplayMarketStep marketId={marketId} commentId={commentId} commentRoot={commentRoot} message={message}/>
      )}
      {!hasInlineMarket && (
        <DecideReplyStep marketId={marketId} commentId={commentId} message={message}/>
      )}
      {!hasInlineMarket && (
        <OtherOptionsStep marketId={marketId} commentId={commentId} message={message}/>
      )}
    </FormdataWizard>
  );
}

ReplyWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

export default ReplyWizard;

