import React from 'react';
import PropTypes from 'prop-types';
import { SUGGEST_CHANGE_TYPE } from '../../constants/comments';
import ExpandableSidebarAction from './ExpandableSidebarAction';
import ChangeHistoryIcon from '@material-ui/icons/ChangeHistory';
import { useIntl } from 'react-intl';


function SuggestChanges(props) {

  const { onClick } = props;
  const intl = useIntl();

  const label = intl.formatMessage({ id: 'commentIconSuggestChangesLabel' });

  function myOnClick() {
    onClick(SUGGEST_CHANGE_TYPE);
  }

  return (
    <ExpandableSidebarAction
      key="issue"
      icon={<ChangeHistoryIcon/>}
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
