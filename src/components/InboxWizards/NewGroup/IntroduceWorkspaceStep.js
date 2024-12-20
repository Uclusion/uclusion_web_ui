import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography, useMediaQuery, useTheme } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { useHistory } from 'react-router';
import {
  ASSIGNED_HASH,
  BACKLOG_HASH,
  DISCUSSION_HASH,
  formatGroupLinkWithSuffix,
  formMarketLink, MARKET_TODOS_HASH,
  navigate,
  preventDefaultAndProp
} from '../../../utils/marketIdPathFunctions';
import Link from '@material-ui/core/Link';
import NavigationChevrons from '../../Menus/NavigationChevrons';
import Sidebar from '../../Menus/Sidebar';
import { getSidebarGroups } from '../../../containers/Screen/Screen';
import { useIntl } from 'react-intl';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';

function IntroduceWorkspaceStep(props) {
  const { message } = props;
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [marketsState] = useContext(MarketsContext);
  const [groupsState] = useContext(MarketGroupsContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('xs'));
  const { market_id: marketId } = message;
  const classes = wizardStyles();
  const history = useHistory();
  const intl = useIntl();
  const market = getMarket(marketsState, marketId) || {};
  const link = formMarketLink(marketId, marketId);
  const pathToBugs = formatGroupLinkWithSuffix(MARKET_TODOS_HASH, marketId, marketId);
  const checkMark = <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill='#3f6b72'
                         style={{ width: 18, height: 18, marginRight: 4, marginBottom: -2 }}
                         viewBox="0 0 20 20">
    <path
      d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
  </svg>;
  const navListItemTextArray = [];
  getSidebarGroups(navListItemTextArray, intl, groupsState, marketPresencesState, groupPresencesState,
    history, marketId, marketId, undefined, undefined, undefined, undefined,
    [], [], undefined, undefined, undefined)

  function myOnFinish () {
    removeWorkListItem(message, messagesDispatch);
    // Go to the workspace when done as that's what was just introduced
    navigate(history, formMarketLink(marketId, marketId));
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        <p>How do you navigate {!mobileLayout && ('the workspace')}</p>
        <Link href={link} onClick={
          (event) => {
            preventDefaultAndProp(event);
          navigate(history, link);
        }
      }>{market.name}</Link>?
      </Typography>
      {!mobileLayout && (
        <div>
          Workspaces are a security boundary where people you invite to one workspace cannot see your other workspaces.
        </div>
      )}
      <div style={{ paddingBottom: '1rem', paddingTop: '1rem' }}>
        <Typography variant="body2" style={{ paddingBottom: '1.5rem' }}>
          {checkMark}ctrl+arrowRight to go to what most likely needs doing
          <div style={{ backgroundColor: '#8ABABF', width: '8rem', height: '60px' }}>
            <NavigationChevrons/></div>
          {!mobileLayout && (
            <div>
              or with mouse use the navigation chevrons in header.
            </div>
          )}
        </Typography>
        <Typography variant="body2" style={{ paddingBottom: '1.5rem' }}>
          {checkMark}Go to a group view by clicking a name in the left side panel:
          <div style={{ backgroundColor: '#DFF0F2', width: '16rem' }}>
            <Sidebar navigationOptions={{ navListItemTextArray }} idPrepend="intro"/>
          </div>
        </Typography>
        <Typography variant="body2" style={{ paddingTop: '0.3rem', paddingBottom: '0.5rem' }}>
          {checkMark}In group view change tabs to send a <Link href={pathToBugs} onClick={(event) => {
          preventDefaultAndProp(event);
          navigate(history, pathToBugs);
        }}>bug</Link>, <Link href={pathToBugs} onClick={(event) => {
          preventDefaultAndProp(event);
          navigate(history, formatGroupLinkWithSuffix(BACKLOG_HASH, marketId, marketId));
        }}>backlog</Link> job, <Link href={pathToBugs} onClick={(event) => {
          preventDefaultAndProp(event);
          navigate(history, formatGroupLinkWithSuffix(ASSIGNED_HASH, marketId, marketId));
        }}>assigned</Link> job, or <Link href={pathToBugs} onClick={(event) => {
          preventDefaultAndProp(event);
          navigate(history, formatGroupLinkWithSuffix(DISCUSSION_HASH, marketId, marketId));
        }}>question or suggestion</Link> to group members.
        </Typography>
      </div>
      <WizardStepButtons
        {...props}
        focus
        showNext={false}
        showTerminate
        onFinish={myOnFinish}
        terminateLabel="notificationDelete"
      />
    </WizardStepContainer>
  );
}

IntroduceWorkspaceStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

IntroduceWorkspaceStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default IntroduceWorkspaceStep;