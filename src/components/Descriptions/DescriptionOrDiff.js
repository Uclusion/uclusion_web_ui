import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { DiffContext } from '../../contexts/DiffContext/DiffContext';
import {
  getDiff,
  markContentViewed,
} from '../../contexts/DiffContext/diffContextHelper'
import DiffDisplay from '../TextEditors/DiffDisplay';
import ReadOnlyQuillEditor from '../TextEditors/ReadOnlyQuillEditor';
import { FormattedMessage } from 'react-intl'
import { findMessageOfTypeAndId } from '../../utils/messageUtils'
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import SpinningIconLabelButton from '../Buttons/SpinningIconLabelButton'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

function DescriptionOrDiff(props) {
  const {
    id,
    description,
    setBeingEdited,
    isEditable
  } = props;

  const [diffState,diffDispatch] = useContext(DiffContext);
  const [showDiff, setShowDiff] = useState(false);
  const [messagesState] = useContext(NotificationsContext);
  const myMessage = findMessageOfTypeAndId(id, messagesState);
  const diff = getDiff(diffState, id);

  function toggleDiffShow(event) {
    event.stopPropagation();
    event.preventDefault();
    markContentViewed(diffDispatch, id, description);
    setShowDiff(!showDiff);
  }

  if (showDiff && myMessage) {
    return (
      <DiffDisplay
        id={id}
        showToggle={toggleDiffShow}
      />
    );
  }
  return (
    <div>
      <ReadOnlyQuillEditor
        value={description}
        setBeingEdited={setBeingEdited}
        isEditable={isEditable}
      />
      {myMessage && diff && (
        <SpinningIconLabelButton icon={ExpandMoreIcon} onClick={toggleDiffShow} doSpin={false}>
          <FormattedMessage id="diffDisplayShowLabel" />
        </SpinningIconLabelButton>
      )}
    </div>
  );
}

DescriptionOrDiff.propTypes = {
  id: PropTypes.string.isRequired,
  description: PropTypes.string
};

export default DescriptionOrDiff;