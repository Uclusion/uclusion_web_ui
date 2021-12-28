import { useIntl } from 'react-intl'
import Screen from '../../../containers/Screen/Screen'
import PropTypes from 'prop-types'
import Inbox from './Inbox'
import MenuBookIcon from '@material-ui/icons/MenuBook'
import React, { useContext } from 'react'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import {
  getNotHiddenMarketDetailsForUser,
  marketTokenLoaded
} from '../../../contexts/MarketsContext/marketsContextHelper'
import _ from 'lodash'
import SettingsIcon from '@material-ui/icons/Settings'
import { Link } from '@material-ui/core'
import DismissableText from '../../../components/Notifications/DismissableText'
import { createTitle, formMarketLink, preventDefaultAndProp } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import AddIcon from '@material-ui/icons/Add'
import { PLANNING_TYPE } from '../../../constants/markets'
import AgilePlanIcon from '@material-ui/icons/PlaylistAdd'

function InboxFull(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const [marketsState, , tokensHash] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  let loading = marketsState.initializing;
  if (!loading && myNotHiddenMarketsState.marketDetails) {
    myNotHiddenMarketsState.marketDetails.forEach((market) => {
      if (!marketTokenLoaded(market.id, tokensHash)) {
        loading = true;
      }
    });
  }
  if (loading) {
    // Cannot allow Quill to try to display a picture without a market token
    return (
      <Screen
        hidden={hidden}
        loading={loading}
        title={intl.formatMessage({ id: 'loadingMessage' })}
      >
        <div />
      </Screen>
    );
  }
  const navigationMenu = {
    showSearch: false,
    navListItemTextArray: [
      {
        icon: AddIcon, text: intl.formatMessage({ id: 'homeAddPlanning' }),
        target: `/wizard#type=${PLANNING_TYPE.toLowerCase()}`
      },
      {
        icon: MenuBookIcon, text: intl.formatMessage({ id: 'planningDialogViewArchivesLabel' }),
        target: (_.size(marketsState.marketDetails) - _.size(myNotHiddenMarketsState.marketDetails) > 0) ? '/archives'
          : undefined
      },
      {
        icon: SettingsIcon, text: intl.formatMessage({ id: 'settings' }),
        target: '/notificationPreferences'
      },
    ]};
  if (myNotHiddenMarketsState.marketDetails) {
    const filtered = myNotHiddenMarketsState.marketDetails.filter((market) => market.market_type === PLANNING_TYPE);
    const sorted = _.sortBy(filtered, 'name');
    const items = sorted.map((market) => {
      return {icon: AgilePlanIcon, text: createTitle(market.name, 20),
        target: formMarketLink(market.id)};
    });
    navigationMenu.navListItemTextArray.unshift(...items);
  }
  return (
    <Screen
      title={intl.formatMessage({id: 'inbox'})}
      tabTitle={intl.formatMessage({id: 'inbox'})}
      hidden={hidden}
      navigationOptions={navigationMenu}
      isInbox
    >
      <DismissableText textId={'settingsHelp'} text={
        <div>
          Use <Link href="/notificationPreferences" onClick={(event) => {
          preventDefaultAndProp(event);
          history.push('/notificationPreferences');
        }}>settings</Link> to change your notifications preferences
          or try our Slack integration.
        </div>
      } />
      <Inbox />
    </Screen>
  );
}

InboxFull.propTypes = {
  hidden: PropTypes.bool.isRequired
}

export default InboxFull;