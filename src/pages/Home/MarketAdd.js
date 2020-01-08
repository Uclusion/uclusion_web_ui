import React from 'react';
import { useHistory } from 'react-router';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import queryString from 'query-string';
import Screen from '../../containers/Screen/Screen';
import DecisionAdd from './DecisionAdd';
import PlanningAdd from './PlanningAdd';
import {
  DECISION_TYPE,
  PLANNING_TYPE,
} from '../../constants/markets';
import InitiativeAdd from './InitiativeAdd';
import { makeBreadCrumbs, navigate } from '../../utils/marketIdPathFunctions';

function MarketAdd(props) {
  const { hidden } = props;
  const history = useHistory();
  const { location } = history;
  const { hash } = location;
  const values = queryString.parse(hash);
  const { type } = values;
  const intl = useIntl();
  // eslint-disable-next-line no-nested-ternary
  const addTitleName = type === DECISION_TYPE ? 'addDecision' : type === PLANNING_TYPE ? 'addPlanning' : 'addInitiative';
  function onDone() {
    navigate(history, '/');
  }
  function getContents() {
    if (type === PLANNING_TYPE) {
      return (
        <PlanningAdd onCancel={onDone} />
      );
    }
    if (type === DECISION_TYPE) {
      return (
        <DecisionAdd onCancel={onDone} />
      );
    }

    return (
      <InitiativeAdd onCancel={onDone} />
    );
  }
  const breadCrumbs = makeBreadCrumbs(history, [], true);
  return (
    <Screen
      title={intl.formatMessage({ id: addTitleName })}
      tabTitle={intl.formatMessage({ id: addTitleName })}
      hidden={hidden}
      breadCrumbs={breadCrumbs}
    >
      {getContents()}
    </Screen>
  );
}

MarketAdd.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default MarketAdd;
