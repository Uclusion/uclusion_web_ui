import React from 'react';
import PropTypes from 'prop-types';
import ExpandableSidebarAction from '../../components/SidebarActions/ExpandableSidebarAction';
import { useIntl } from 'react-intl';
import CallSplitIcon from '@material-ui/icons/CallSplit';

function DecisionAddActionButton(props) {

  const { onClick } = props;

  const intl = useIntl();
  const label = intl.formatMessage({ id: 'homeAddDecision' });

  return (
    <ExpandableSidebarAction
      icon={<CallSplitIcon />}
      label={label}
      onClick={onClick}/>
  );
}

DecisionAddActionButton.propTypes = {
  onClick: PropTypes.func,
};

DecisionAddActionButton.defaultProps = {
  onClick: () => {},
};

export default DecisionAddActionButton;