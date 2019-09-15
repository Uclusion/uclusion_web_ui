import React, { useState } from 'react';
import { AppBar, Tabs, Tab } from '@material-ui/core';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import InvestibleView from '../Investibles/InvestibleView';
import useAsyncInvestiblesContext from '../../contexts/useAsyncInvestiblesContext';
import TabPanel from '../Tabs/TabPanel';
import _ from 'lodash';
import InvestibleEdit from '../Investibles/InvestibleEdit';

function InvestiblesNav(props) {
  const { intl, marketId, investibleId, comments, commentsHash } = props;
  const { getCachedInvestibles } = useAsyncInvestiblesContext();
  const investibles = getCachedInvestibles(marketId);
  const startingTab = investibleId || (!_.isEmpty(investibles) && investibles[0].id);
  const [selectedTab, setSelectedTab] = useState(startingTab);
  const [editOpen, setEditOpen] = useState({});

  function switchTab(event, newValue) {
    setSelectedTab(newValue);
  }

  function toggleEditMode(id) {
    return () => setEditOpen({ [id]: !editOpen[id] });
  }

  function getTabs() {
    return investibles.map(inv => <Tab label={inv.name} value={inv.id} key={inv.id}/>);
  }

  function getTabContent() {
    return investibles.map((inv) => {
      const { id } = inv;
      const investibleComments = comments.filter(comment => comment.investible_id === id);
      const editMode = editOpen[id];
      return (
        <TabPanel key={id} index={id} value={selectedTab}>
          {editMode && <InvestibleEdit investible={inv}
                                       editToggle={toggleEditMode(id)}
                                       onSave={toggleEditMode(id)}/>}
          {!editMode && <InvestibleView investible={inv}
                                        comments={investibleComments}
                                        editToggle={toggleEditMode(id)}
                                        commentsHash={commentsHash}/>}
        </TabPanel>
      );
    });
  }

  return (
    <div>
      <AppBar position="static" color="default">
        {!_.isEmpty(investibles) && (
          <Tabs value={selectedTab}
                indicatorColor="primary"
                textColor="primary"
                variant="scrollable"
                onChange={switchTab}
          >
            {getTabs()}
          </Tabs>
        )}
      </AppBar>
      {getTabContent()}
    </div>
  );
}

InvestiblesNav.propTypes = {
  intl: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  investibleId: PropTypes.string.isRequired,
  comments: PropTypes.arrayOf(PropTypes.object),
  commentsHash: PropTypes.object,
};

export default injectIntl(InvestiblesNav);
