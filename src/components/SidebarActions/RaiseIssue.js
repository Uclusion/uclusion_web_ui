import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import ReportProblemIcon from '@material-ui/icons/ReportProblem';
import { useIntl } from 'react-intl';
import { ISSUE_TYPE } from '../../constants/comments';
import ExpandableSidebarAction from './ExpandableSidebarAction';
import { CommentAddContext } from '../../contexts/CommentAddContext';


function RaiseIssue(props) {

  const { onClick, commentAddRef } = props;
  const intl = useIntl();
  const [addState, setAddState] = useContext(CommentAddContext);
  const label = intl.formatMessage({ id: 'commentIconRaiseIssueLabel' });

  function myOnClick() {
    if (commentAddRef && commentAddRef.current) {
      window.scrollTo(0, commentAddRef.current.offsetTop);
    }
    setAddState({
      ...addState,
      hidden: false,
      type: ISSUE_TYPE,
    });
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
