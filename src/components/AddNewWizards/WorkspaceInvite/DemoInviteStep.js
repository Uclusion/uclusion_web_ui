import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography, useMediaQuery, useTheme } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import {
  ASSIGNED_HASH,
  BACKLOG_HASH,
  DISCUSSION_HASH,
  formatGroupLinkWithSuffix,
  formMarketLink,
  MARKET_TODOS_HASH,
  navigate,
  preventDefaultAndProp
} from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import Link from '@material-ui/core/Link';
import NavigationChevrons from '../../Menus/NavigationChevrons';
import Sidebar from '../../Menus/Sidebar';
import { getSidebarGroups, screenStyles } from '../../../containers/Screen/Screen';
import { useIntl } from 'react-intl';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';

function DemoInviteStep (props) {
  const { marketId } = props;
  const history = useHistory();
  const intl = useIntl();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('xs'));
  const classes = useContext(WizardStylesContext);
  const screenClasses = screenStyles();
  const [marketsState] = useContext(MarketsContext);
  const [groupsState] = useContext(MarketGroupsContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
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
  const isSolo = market.name?.includes('solo');
  getSidebarGroups(navListItemTextArray, intl, groupsState, marketPresencesState, groupPresencesState,
    history, market, marketId, marketId, undefined, undefined, undefined, undefined, [], [], undefined, undefined, undefined,
    undefined, undefined, screenClasses);

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText}>
        <p>Welcome! See Uclusion in action in this</p>
        <Link href={link} onClick={
          (event) => {
            preventDefaultAndProp(event);
            navigate(history, link);
          }
        }>{market.name}</Link>
      </Typography>
      {isSolo && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Here you work alone but this workspace includes a fake participant if you want to try collaboration.
          Play around and when you are ready create your own workspace and this demo will be removed.
        </Typography>
      )}
      {!isSolo && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Here you are a team member already working on UScript for a while. Play around and when you are
          ready create your own workspace and this demo will be removed.
        </Typography>
      )}
      <h2 style={{marginTop: '1.75rem', marginBottom: 0}}>
        Navigation
      </h2>
      <div style={{ paddingBottom: '1rem', paddingTop: '1rem' }}>
        <Typography variant="body2" style={{ paddingBottom: '1.5rem' }}>
          {checkMark}ctrl+arrowRight to go to what most likely needs doing
          <div style={{ backgroundColor: '#8ABABF', width: '8rem', height: '60px' }}>
            <NavigationChevrons groupLoadId={marketId}/></div>
          {!mobileLayout && (
            <div>
              or with mouse use the navigation chevrons in header.
            </div>
          )}
        </Typography>
        <Typography variant="body2" style={{ paddingBottom: '1.5rem' }}>
          {checkMark}Go to a view by clicking a name in the left side panel:
          <div style={{ backgroundColor: '#DFF0F2', width: '16rem' }}>
            <Sidebar navigationOptions={{ navListItemTextArray }} idPrepend="intro"/>
          </div>
        </Typography>
        <Typography variant="body2" style={{ paddingTop: '0.3rem', paddingBottom: '0.5rem' }}>
          {checkMark}In a view change tabs to send a <Link href={pathToBugs} onClick={(event) => {
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
    </WizardStepContainer>
  );
}

DemoInviteStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DemoInviteStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DemoInviteStep;