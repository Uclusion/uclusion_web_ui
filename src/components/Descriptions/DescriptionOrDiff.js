import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import DiffDisplay from '../TextEditors/DiffDisplay';
import { findMessageOfTypeAndId } from '../../utils/messageUtils'
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import QuillEditor2 from '../TextEditors/QuillEditor2'
import _ from 'lodash'
import { getDiff } from '../../contexts/DiffContext/diffContextHelper';
import { DiffContext } from '../../contexts/DiffContext/DiffContext';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';

function DescriptionOrDiff(props) {
  const {
    id,
    description,
    showDiff,
    backgroundColor = '#EDF7F8'
  } = props;

  const [messagesState] = useContext(NotificationsContext);
  const [diffState] = useContext(DiffContext);
  const [marketsState, , tokensHash] = useContext(MarketsContext);
  const myMessage = findMessageOfTypeAndId(id, messagesState, 'DESCRIPTION');
  const diff = marketsState.initializing || _.isEmpty(tokensHash) ? undefined : getDiff(diffState, id);

  if (myMessage && showDiff && diff) {
    return (
      <DiffDisplay
        id={id}
      />
    );
  }
  if (!id || _.isEmpty(description)) {
    return React.Fragment;
  }

  return (
    <div>
      <QuillEditor2
        id={`readOnlyDiff${id}`}
        value={description}
        noToolbar
        backgroundColor={backgroundColor}
      />
    </div>
  );
}

DescriptionOrDiff.propTypes = {
  id: PropTypes.string.isRequired,
  description: PropTypes.string,
  showDiff: PropTypes.bool
};

export default DescriptionOrDiff;