import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import localforage from 'localforage'
import _ from 'lodash'
import { MarketsContext } from '../contexts/MarketsContext/MarketsContext'
import { getMyUserForMarket } from '../contexts/MarketsContext/marketsContextHelper'
import DialogBodyEdit from './Dialog/DialogBodyEdit'
import InvestibleBodyEdit from './Investible/InvestibleBodyEdit'
import { getInvestible } from '../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../contexts/InvestibesContext/InvestiblesContext'

function BodyEdit(props) {
  const { hidden, setBeingEdited, marketId, loadId } = props;
  const [marketsState] = useContext(MarketsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [idLoaded, setIdLoaded] = useState(undefined);
  const userId = getMyUserForMarket(marketsState, marketId);
  const loading = !userId || idLoaded !== loadId;
  const [loaded, setLoaded] = useState(undefined);

  useEffect(() => {
    if (!hidden && idLoaded !== loadId) {
      localforage.getItem(loadId).then((stateFromDisk) => {
        if (!_.isEmpty(stateFromDisk)) {
          setBeingEdited(true);
          setLoaded(stateFromDisk)
        }
        setIdLoaded(loadId);
      });
    }
    if (hidden && idLoaded) {
      setIdLoaded(undefined);
    }
    return () => {};
  }, [hidden, idLoaded, loadId, setBeingEdited]);

  if (loading) {
    return React.Fragment;
  }

  if (loadId === marketId) {
    return (
      <DialogBodyEdit loaded={loaded} userId={userId} {...props} />
    );
  }
  const inv = getInvestible(investiblesState, loadId);
  if (_.isEmpty(inv)) {
    return React.Fragment;
  }
  return (
    <InvestibleBodyEdit loaded={loaded} userId={userId} fullInvestible={inv} {...props} />
  );
}

BodyEdit.propTypes = {
  hidden: PropTypes.bool.isRequired,
  marketId: PropTypes.object.isRequired,
  loadId: PropTypes.object.isRequired,
  setBeingEdited: PropTypes.func.isRequired
};

export default BodyEdit;
