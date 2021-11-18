import { useIntl } from 'react-intl'
import Screen from '../../../containers/Screen/Screen'
import PropTypes from 'prop-types'
import Inbox from './Inbox'
import MenuBookIcon from '@material-ui/icons/MenuBook'
import React, { useContext } from 'react'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getNotHiddenMarketDetailsForUser } from '../../../contexts/MarketsContext/marketsContextHelper'
import _ from 'lodash'
import SettingsIcon from '@material-ui/icons/Settings'
import { Link } from '@material-ui/core'
import DismissableText from '../../../components/Notifications/DismissableText'
import { preventDefaultAndProp } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'

function InboxFull(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  const navigationMenu = {
    showSearch: false,
    navListItemTextArray: [
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
  return (
    <Screen
      title={intl.formatMessage({id: 'inbox'})}
      tabTitle={intl.formatMessage({id: 'inbox'})}
      hidden={hidden}
      navigationOptions={navigationMenu}
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