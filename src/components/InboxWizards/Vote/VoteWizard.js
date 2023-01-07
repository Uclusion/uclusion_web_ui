import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import FormdataWizard from 'react-formdata-wizard';
import DecideVoteStep from './DecideVoteStep'
import VoteCertaintyStep from './VoteCertaintyStep'
import { wizardFinish } from '../InboxWizardUtils'
import { formCommentLink } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { getCommentRoot } from '../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'

function VoteWizard(props) {
  const { marketId, commentId, message } = props;
  const history = useHistory();
  const [commentState] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};

  function myOnFinish() {
    wizardFinish({link: formCommentLink(marketId, commentRoot.group_id, commentRoot.investible_id,
          commentRoot.id)},
      setOperationRunning, message, history);
  }

  return (
    <FormdataWizard name={`vote_wizard${commentId}`}
                    defaultFormData={{parentElementId: `workListItem${message.type_object_id}`}}>
      <DecideVoteStep onFinish={myOnFinish} marketId={marketId} commentRoot={commentRoot} message={message}/>
      <VoteCertaintyStep onFinish={myOnFinish} marketId={marketId} commentRoot={commentRoot} message={message}/>
    </FormdataWizard>
  );
}

VoteWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

VoteWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default VoteWizard;

