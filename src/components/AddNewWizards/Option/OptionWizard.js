import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import OptionDescriptionStep from './OptionDescriptionStep';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { getComment } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';

function OptionWizard(props) {
  const { marketId } = props;
  const [marketsState] = useContext(MarketsContext);
  const [commentsState] = useContext(CommentsContext);
  const market = getMarket(marketsState, marketId) || {};
  const { parent_comment_id: parentCommentId, parent_comment_market_id: parentMarketId } = market;
  const parentComment = getComment(commentsState, parentMarketId, parentCommentId) || {};
  const { investible_id: parentInvestibleId, group_id: parentGroupId, created_by: createdBy } = parentComment;

  if (!parentGroupId) {
    return React.Fragment;
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name="option_wizard" useLocalStorage={false} defaultFormData={{useCompression: true}}>
        <OptionDescriptionStep marketId={marketId} parentMarketId={parentMarketId} parentCommentId={parentCommentId}
                               parentInvestibleId={parentInvestibleId} parentGroupId={parentGroupId}
                               createdBy={createdBy} />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

OptionWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

OptionWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default OptionWizard;

