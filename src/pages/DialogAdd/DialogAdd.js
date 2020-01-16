import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import localforage from 'localforage';
import queryString from 'query-string';
import Screen from '../../containers/Screen/Screen';
import DecisionAdd from './DecisionAdd';
import PlanningAdd from './PlanningAdd';
import {
  DECISION_TYPE, INITIATIVE_TYPE,
  PLANNING_TYPE,
} from '../../constants/markets';
import InitiativeAdd from './InitiativeAdd';
import { makeBreadCrumbs, navigate } from '../../utils/marketIdPathFunctions';

function DialogAdd(props) {
  const { hidden } = props;
  const history = useHistory();
  const { location } = history;
  const { hash } = location;
  const values = queryString.parse(hash);
  const { type } = values;
  const intl = useIntl();
  // eslint-disable-next-line no-nested-ternary
  const addTitleName = type === DECISION_TYPE ? 'addDecision' : type === PLANNING_TYPE ? 'addPlanning' : 'addInitiative';
  const [storedDescription, setStoredDescription] = useState(undefined);
  const [idLoaded, setIdLoaded] = useState(undefined);

  useEffect(() => {
    if (!hidden) {
      localforage.getItem(`add_market_${type}`).then((description) => {
        setStoredDescription(description || '');
        setIdLoaded(type);
      });
    }
    if (hidden) {
      setIdLoaded(undefined);
    }
  }, [hidden, type]);

  function onDone() {
    setIdLoaded(undefined);
    localforage.removeItem(`add_market_${type}`)
      .then(() => navigate(history, '/'));
  }

  const breadCrumbs = makeBreadCrumbs(history, [], true);
  return (
    <Screen
      title={intl.formatMessage({ id: addTitleName })}
      tabTitle={intl.formatMessage({ id: addTitleName })}
      hidden={hidden}
      breadCrumbs={breadCrumbs}
    >
      {type === PLANNING_TYPE && idLoaded === type && (
        <PlanningAdd onDone={onDone} storedDescription={storedDescription} />
      )}
      {type === DECISION_TYPE && idLoaded === type && (
        <DecisionAdd onDone={onDone} storedDescription={storedDescription} />
      )}

      {type === INITIATIVE_TYPE && idLoaded === type && (
        <InitiativeAdd onDone={onDone} storedDescription={storedDescription} />
      )}
    </Screen>
  );
}

DialogAdd.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default DialogAdd;
