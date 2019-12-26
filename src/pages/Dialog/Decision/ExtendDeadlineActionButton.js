import React from 'react';
import PropTypes from 'prop-types';
import UpdateIcon from '@material-ui/icons/Update';
import { useIntl } from 'react-intl';
import ExpandableSidebarAction from '../../../components/SidebarActions/ExpandableSidebarAction';

function ExtendDeadlineActionButton(props){

  const { onClick } = props;
  const intl = useIntl();

  return (
    <ExpandableSidebarAction
      icon={<UpdateIcon />}
      label={intl.formatMessage({ id: 'decisionDialogsExtendDeadline' })}
      onClick={onClick}
    />
  );
}

ExtendDeadlineActionButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default ExtendDeadlineActionButton;