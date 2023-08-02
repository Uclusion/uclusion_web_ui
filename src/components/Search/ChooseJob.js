import React, { useContext, useState } from 'react';
import { SearchIndexContext } from '../../contexts/SearchIndexContext/SearchIndexContext';
import {
  Checkbox,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  useMediaQuery,
  useTheme
} from '@material-ui/core';
import _ from 'lodash';
import SearchIcon from '@material-ui/icons/Search';
import { usePlanFormStyles } from '../AgilePlan';
import { getMarketInfo } from '../../utils/userFunctions';
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import clsx from 'clsx';
import { getTicketNumber } from '../../utils/stringFunctions';
import { useIntl } from 'react-intl';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';

function ChooseJob(props) {
  const {
    marketStages=[],
    excluded=[],
    groupId,
    marketId,
    onChange,
    formData
  } = props;
  const [index] = useContext(SearchIndexContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const intl = useIntl();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchQuery, setSearchQuery] = useState(undefined);
  const [isAssignedToMe, setIsAssignedToMe] = useState(false);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const myPresence = marketPresences.find((presence) => presence.current_user);
  const userId = myPresence?.id;
  const classes = usePlanFormStyles();
  const marketStageIds = marketStages.map((stage) => stage.id);
  const activeGroupInvestibles = (getMarketInvestibles(investiblesState, marketId) || []).filter((inv) => {
    const marketInfo = getMarketInfo(inv, marketId);
    const { investible } = inv;
    const { group_id: investibleGroupId, stage: investibleStageId, assigned } = marketInfo || {};
    return investibleGroupId === groupId && !excluded.includes(investible.id) &&
      marketStageIds.includes(investibleStageId) && (!isAssignedToMe || assigned?.includes(userId));
  });
  const results = _.isEmpty(searchQuery) ? undefined : (index.search(searchQuery) || []);
  const investibles = _.isEmpty(searchQuery) ? activeGroupInvestibles : activeGroupInvestibles.filter((inv) => {
    const { investible } = inv;
    return results.find((item) => item.id === investible.id);
  });
  const { investibleId } = formData;

  function onSearchChange(event) {
    const { value } = event.target
    setSearchQuery(value);
  }

  function toggleAssignedToMe() {
    setIsAssignedToMe(!isAssignedToMe);
  }

  function renderInvestibleItem(inv) {
    const { investible } = inv;
    const myInvestibleId = investible.id;
    const isChecked = investibleId === myInvestibleId;
    const marketInfo = getMarketInfo(inv, marketId);
    const { ticket_code: ticketCode } = marketInfo;
    const ticketNumber = getTicketNumber(ticketCode);
    const displayName = ticketNumber ? `J-${ticketNumber} ${investible.name}` : investible.name;
    return (
      <ListItem
        key={myInvestibleId}
        onClick={() => onChange(isChecked ? undefined : myInvestibleId)}
        className={isChecked ? clsx(classes.unselected, classes.selected) : classes.unselected}
      >
        <ListItemIcon>
          <Checkbox
            checked={isChecked}
          />
        </ListItemIcon>
        <ListItemText>
          {displayName}
        </ListItemText>
      </ListItem>
    );
  }

  return (
    <List
      dense
      className={classes.scrollableList}
    >
      <ListItem className={classes.searchContainer} key="search">
          <ListItemText style={{width: '80%'}}>
            <TextField
              className={classes.search}
              placeholder="Search in this group"
              onChange={onSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='end'>
                    <IconButton>
                      <SearchIcon/>
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </ListItemText>
        <ListItemText>
          {intl.formatMessage({ id: mobileLayout ? 'searchAssignedMobile' : 'searchAssigned' })}
          <Checkbox
            checked={isAssignedToMe}
            onClick={toggleAssignedToMe}
          />
        </ListItemText>
      </ListItem>
      <List
        dense
        id="investiblesList"
        className={classes.scrollContainer}
      >
        {investibles.map((investible) => renderInvestibleItem(investible))}
      </List>
    </List>
  );
}

export default ChooseJob;