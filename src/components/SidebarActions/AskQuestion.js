import React from 'react';
import PropTypes from 'prop-types';
import { QUESTION_TYPE } from '../../constants/comments';
import ExpandableSidebarAction from './ExpandableSidebarAction';
import ContactSupportIcon from '@material-ui/icons/ContactSupport';
import { useIntl } from 'react-intl';


function AskQuestions(props) {

  const { onClick } = props;
  const intl = useIntl();

  const label = intl.formatMessage({ id: 'commentIconAskQuestionLabel' });

  function myOnClick() {
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
