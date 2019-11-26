import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { ISSUE_TYPE, SUGGEST_CHANGE_TYPE } from '../../constants/comments';
import ExpandableSidebarAction from './ExpandableSidebarAction';
import ChangeHistoryIcon from '@material-ui/icons/ChangeHistory';
import { useIntl } from 'react-intl';
import { CommentAddContext } from '../../contexts/CommentAddContext';


function SuggestChanges(props) {

  const { onClick } = props;
  const intl = useIntl();
  const [addState, setAddState] = useContext(CommentAddContext);

  const label = intl.formatMessage({ id: 'commentIconSuggestChangesLabel' });

  function myOnClick() {
    setAddState({
      ...addState,
      hidden: false,
      type: SUGGEST_CHANGE_TYPE,
    });

    onClick(SUGGEST_CHANGE_TYPE);
  }

  return (
    <ExpandableSidebarAction
      key="issue"
      icon={<ChangeHistoryIcon />}
      label={label}
      onClick={myOnClick}
    />
  );
}

SuggestChanges.propTypes = {
  onClick: PropTypes.func,
};

SuggestChanges.defaultProps = {
  onClick: () => {},
};

export default SuggestChanges;
