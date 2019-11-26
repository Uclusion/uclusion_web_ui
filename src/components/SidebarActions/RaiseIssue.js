import React from 'react';
import PropTypes from 'prop-types';
import ReportProblemIcon from '@material-ui/icons/ReportProblem';
import { useIntl } from 'react-intl';
import { ISSUE_TYPE } from '../../constants/comments';
import ExpandableSidebarAction from './ExpandableSidebarAction';


function RaiseIssue(props) {

  const { onClick } = props;
  const intl = useIntl();
  const label = intl.formatMessage({ id: 'commentIconRaiseIssueLabel' });

  function myOnClick() {
    onClick(ISSUE_TYPE);
  }

  return (
    <ExpandableSidebarAction
      icon={<ReportProblemIcon/>}
      label={label}
      onClick={myOnClick}
    />
  );
}

RaiseIssue.propTypes = {
  onClick: PropTypes.func,
};

RaiseIssue.defaultProps = {
  onClick: () => {},
};

export default RaiseIssue;
