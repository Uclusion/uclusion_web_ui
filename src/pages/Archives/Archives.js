import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import {
  getHiddenMarketDetailsForUser
} from '../../contexts/MarketsContext/marketsContextHelper'
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets'
import Screen from '../../containers/Screen/Screen'
import SubSection from '../../containers/SubSection/SubSection'
import PlanningDialogs from '../Home/PlanningDialogs'
import DecisionDialogs from '../Home/DecisionDialogs'
import InitiativeDialogs from '../Home/InitiativeDialogs'
import { makeBreadCrumbs } from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { useIntl } from 'react-intl'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'

function Archives (props) {
  const { hidden } = props
  const history = useHistory()
  const intl = useIntl()

  const [marketsState] = useContext(MarketsContext)
  const [marketPresencesState] = useContext(MarketPresencesContext)
  const hiddenMarkets = getHiddenMarketDetailsForUser(marketsState, marketPresencesState)
  const planningDetails = hiddenMarkets.filter((market) => market.market_type === PLANNING_TYPE)
  const decisionDetails = hiddenMarkets.filter((market) => market.market_type === DECISION_TYPE)
  const initiativeDetails = hiddenMarkets.filter((market) => market.market_type === INITIATIVE_TYPE)
  const breadCrumbs = makeBreadCrumbs(history, [], true)
  return (
    <Screen
      title={intl.formatMessage({ id: 'archivesTitle' })}
      tabTitle={intl.formatMessage({ id: 'archivesTitle' })}
      hidden={hidden}
      breadCrumbs={breadCrumbs}
    >
      <SubSection>
        <PlanningDialogs markets={planningDetails} />
      </SubSection>
      <SubSection>
        <DecisionDialogs markets={decisionDetails} />
      </SubSection>
      <SubSection>
        <InitiativeDialogs markets={initiativeDetails} />
      </SubSection>
    </Screen>
  )
}

Archives.propTypes = {
  hidden: PropTypes.bool
}

Archives.defaultProps = {
  hidden: false
}

export default Archives
