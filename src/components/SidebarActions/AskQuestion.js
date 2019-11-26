import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { QUESTION_TYPE } from '../../constants/comments';
import ExpandableSidebarAction from './ExpandableSidebarAction';
import ContactSupportIcon from '@material-ui/icons/ContactSupport';
import { useIntl } from 'react-intl';
import { CommentAddContext } from '../../contexts/CommentAddContext';


function AskQuestions(props) {

  const { onClick } = props;
  const intl = useIntl();
  const [addState, setAddState] = useContext(CommentAddContext);

  const label = intl.formatMessage({ id: 'commentIconAskQuestionLabel' });

  function myOnClick() {
    setAddState({
      ...addState,
      hidden: false,
      type: QUESTION_TYPE,
    });

    onClick(QUESTION_TYPE);
  }

  return (
    <ExpandableSidebarAction
      key="issue"
      icon={<ContactSupportIcon />}
      label={label}
      onClick={myOnClick}
    />
  );
}

AskQuestions.propTypes = {
  amOpen: PropTypes.bool,
  setAmOpen: PropTypes.func,
  onClick: PropTypes.func,
};

AskQuestions.defaultProps = {
  amOpen: false,
  setAmOpen: () => {},
  onClick: () => {},
};

export default AskQuestions;
