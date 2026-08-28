import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography, useMediaQuery, useTheme } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import {
  formMarketLink,
  navigate,
  preventDefaultAndProp
} from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import Link from '@material-ui/core/Link';
import NavigationChevrons from '../../Menus/NavigationChevrons';
import { getSidebarGroups, screenStyles } from '../../../containers/Screen/Screen';
import { useIntl } from 'react-intl';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { useButtonColors } from '../../Buttons/ButtonConstants';
import { ThemeModeContext } from '../../../contexts/ThemeModeContext';

function DemoInviteStep (props) {
  const { marketId } = props;
  const history = useHistory();
  const intl = useIntl();
  const theme = useTheme();
  const [themeMode] = useContext(ThemeModeContext);
  const isDark = themeMode === 'dark';
  const mobileLayout = useMediaQuery(theme.breakpoints.down('xs'));
  const classes = useContext(WizardStylesContext);
  const screenClasses = screenStyles();
  const { infoColor } = useButtonColors();
  const [marketsState] = useContext(MarketsContext);
  const [groupsState] = useContext(MarketGroupsContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const market = getMarket(marketsState, marketId) || {};
  const link = formMarketLink(marketId, marketId);
  const navListItemTextArray = [];
  getSidebarGroups(isDark, navListItemTextArray, intl, groupsState, marketPresencesState, groupPresencesState, history, market, marketId, marketId, 
    screenClasses);

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText}>
        Work should be more than chat.
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Uclusion gives developers and AI agents a shared place to plan work. Jobs, questions, suggestions,
        and approvals stay structured and visible instead of disappearing into a chat log. Explore <Link href={link} onClick={
          (event) => {
            preventDefaultAndProp(event);
            navigate(history, link);
          }
        }>{market.name}</Link> to see it in action.
      </Typography>
      <h2 style={{marginTop: '1.75rem', marginBottom: 0}}>
        Navigation
      </h2>
      <div style={{ paddingTop: '1rem' }}>
        <Typography variant="body2" style={{ paddingBottom: '1.5rem' }}>
          ctrl+arrowRight does what the Next, View, or In progress button currently says
          <div style={{ backgroundColor: infoColor, width: '32rem', height: '60px' }}>
            <NavigationChevrons action='demo' defaultMarket={market} pathMarketIdRaw={market?.id} 
              isArchivedWorkspace={false} /></div>
          {!mobileLayout && (
            <div>
              or with mouse use the navigation chevrons in the header above.
            </div>
          )}
        </Typography>
      </div>
      <h2 style={{marginTop: '1.75rem', marginBottom: 0}}>
        To create a workspace and end the demo
      </h2>
      <div style={{ paddingBottom: '1rem', paddingTop: '1rem' }}>
        Skip the demo by clicking 'Get started' in the header above.
      </div>
    </WizardStepContainer>
  );
}

DemoInviteStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default DemoInviteStep;
