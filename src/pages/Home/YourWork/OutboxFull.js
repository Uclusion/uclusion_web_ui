import { useIntl } from 'react-intl'
import Screen from '../../../containers/Screen/Screen'
import PropTypes from 'prop-types'
import Outbox from './Outbox'
import React, { useContext, useReducer } from 'react'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import {
  getNotHiddenMarketDetailsForUser,
  marketTokenLoaded
} from '../../../contexts/MarketsContext/marketsContextHelper'
import _ from 'lodash'

function OutboxFull(props) {
  const { hidden } = props;
  const intl = useIntl();
  const [marketsState, , tokensHash] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [expansionState, expansionDispatch] = useReducer((state, action) => {
    const { id } = action;
    let newExpanded = state;
    if (id !== undefined) {
      if (state[id] === undefined) {
        newExpanded = {...state, [id]: true};
      } else {
        newExpanded = _.omit(state, id);
      }
    }
    return newExpanded;
  }, {});
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
  return (
    <Screen
      title={intl.formatMessage({id: 'outbox'})}
      tabTitle={intl.formatMessage({id: 'outbox'})}
      hidden={hidden}
      isPending
    >
      <Outbox expansionState={expansionState} expansionDispatch={expansionDispatch} />
    </Screen>
  );
}

OutboxFull.propTypes = {
  hidden: PropTypes.bool.isRequired
}

export default OutboxFull;