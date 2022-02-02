import { useIntl } from 'react-intl'
import Screen from '../../../containers/Screen/Screen'
import PropTypes from 'prop-types'
import Inbox from './Inbox'
import React, { useContext, useState } from 'react'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import {
  getHiddenMarketDetailsForUser,
  getNotHiddenMarketDetailsForUser,
  marketTokenLoaded
} from '../../../contexts/MarketsContext/marketsContextHelper'
import _ from 'lodash'
import SettingsIcon from '@material-ui/icons/Settings'
import { Link } from '@material-ui/core'
import DismissableText from '../../../components/Notifications/DismissableText'
import { formMarketLink, preventDefaultAndProp } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import AddIcon from '@material-ui/icons/Add'
import { PLANNING_TYPE } from '../../../constants/markets'
import AgilePlanIcon from '@material-ui/icons/PlaylistAdd'
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext'

function InboxFull(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const [showAll, setShowAll] = useState(false);
  const [expandAll, setExpandAll] = useState(undefined);
  const [marketsState, , tokensHash] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [searchResults] = useContext(SearchResultsContext);
  const { results, parentResults, search } = searchResults;
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  const hiddenMarketsRaw = getHiddenMarketDetailsForUser(marketsState, marketPresencesState) || [];
  const hiddenMarkets = hiddenMarketsRaw.filter((market) => market.market_type === PLANNING_TYPE);
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

  function showMarketDisabled(marketId, defaultValue) {
    if (_.isEmpty(search)) {
      return defaultValue;
    }

    return !(results.find((result) => result.id === marketId || result.marketId === marketId)
      ||parentResults.includes(marketId));
  }

  const navigationMenu = {
    navListItemTextArray: [
      {
        icon: AddIcon, text: intl.formatMessage({ id: 'homeAddPlanning' }),
        target: `/wizard#type=${PLANNING_TYPE.toLowerCase()}`
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
      return {icon: AgilePlanIcon, text: market.name, isGreyed: showMarketDisabled(market.id, false),
        target: formMarketLink(market.id)};
    });
    navigationMenu.navListItemTextArray.unshift(...items);
  }
  if (!_.isEmpty(hiddenMarkets)) {
    if (showAll) {
      const sorted = _.sortBy(hiddenMarkets, 'name');
      const items = sorted.map((market) => {
        return {
          icon: AgilePlanIcon, text: market.name,
          isGreyed: showMarketDisabled(market.id, true),
          target: formMarketLink(market.id)
        };
      });
      navigationMenu.navListItemTextArray.push({
        text: intl.formatMessage({ id: 'removeArchive' }),
        onClickFunc: (event) => {
          preventDefaultAndProp(event);
          setShowAll(false);
        }
      });
      navigationMenu.navListItemTextArray = navigationMenu.navListItemTextArray.concat(items);
    } else {
      navigationMenu.navListItemTextArray.push({
        text: intl.formatMessage({ id: 'seeArchives' }),
        onClickFunc: (event) => {
          preventDefaultAndProp(event);
          setShowAll(true);
        }
      });
    }
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
      <Inbox expandAll={expandAll} setExpandAll={setExpandAll} />
    </Screen>
  );
}

InboxFull.propTypes = {
  hidden: PropTypes.bool.isRequired
}

export default InboxFull;