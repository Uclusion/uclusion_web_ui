import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { useHistory } from 'react-router'
import { useIntl } from 'react-intl'
import { makeStyles } from '@material-ui/core'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getHiddenMarketDetailsForUser, } from '../../contexts/MarketsContext/marketsContextHelper'
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets'
import Screen from '../../containers/Screen/Screen'
import PlanningDialogs from '../Home/PlanningDialogs'
import { makeBreadCrumbs } from '../../utils/marketIdPathFunctions'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import ArchivesCheatSheet from './ArchivesCheatSheet'
import InitiativesAndDialogs from '../Home/InitiativesAndDialogs'

const useStyles = makeStyles((theme) => ({
  spacer: {
    borderColor: '#ccc',
    borderStyle: 'solid',
    margin: '2rem 0'
  }
})
)
function Archives(props) {
  const { hidden } = props;
  const history = useHistory();
  const intl = useIntl();
  const classes = useStyles()
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const hiddenMarkets = getHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  const planningDetails = hiddenMarkets.filter((market) => market.market_type === PLANNING_TYPE);
  const decisionDetails = _.sortBy(hiddenMarkets.filter((market) => market.market_type === DECISION_TYPE && !market.parent_comment_id), 'updated_at').reverse();
  const initiativeDetails = _.sortBy(hiddenMarkets.filter((market) => market.market_type === INITIATIVE_TYPE), 'updated_at').reverse();
  const emptyArchives = _.isEmpty(planningDetails) && _.isEmpty(decisionDetails) && _.isEmpty(initiativeDetails);

  const breadCrumbs = makeBreadCrumbs(history, [], true);
  return (
    <Screen
      title={intl.formatMessage({ id: 'archivesTitle' })}
      tabTitle={intl.formatMessage({ id: 'archivesTitle' })}
      hidden={hidden}
      breadCrumbs={breadCrumbs}
    >
      { emptyArchives && (
        <ArchivesCheatSheet />
      )}
      {!emptyArchives && (
        <>
            <PlanningDialogs markets={planningDetails} isArchives/>
            <hr className={classes.spacer}/>
            <InitiativesAndDialogs dialogs={decisionDetails} initiatives={initiativeDetails}/>
        </>
      )}
    </Screen>
  );
}

Archives.propTypes = {
  hidden: PropTypes.bool,
};

Archives.defaultProps = {
  hidden: false,
};

export default Archives;
