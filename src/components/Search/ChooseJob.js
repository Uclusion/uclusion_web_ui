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
  TextField, Typography,
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
import { useIntl } from 'react-intl';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import GravatarGroup from '../Avatars/GravatarGroup';
import {
  getStages,
  isInReviewStage,
  isNotDoingStage
} from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { getSearchResults } from '../../contexts/SearchIndexContext/searchIndexContextHelper';

function ChooseJob(props) {
  const {
    excluded=[],
    groupId,
    marketId,
    onChange,
    formData
  } = props;
  const [index] = useContext(SearchIndexContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const intl = useIntl();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchQuery, setSearchQuery] = useState(undefined);
  const [isAssignedToMe, setIsAssignedToMe] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const marketStages = getStages(marketStagesState, marketId);
  const activeMarketStages = isActive ? marketStages.filter((stage) => {
    return !isInReviewStage(stage) && !isNotDoingStage(stage);
  }) : marketStages;
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const myPresence = marketPresences.find((presence) => presence.current_user);
  const userId = myPresence?.id;
  const classes = usePlanFormStyles();
  const marketStageIds = activeMarketStages.map((stage) => stage.id);
  const activeGroupInvestibles = (getMarketInvestibles(investiblesState, marketId) || []).filter((inv) => {
    const marketInfo = getMarketInfo(inv, marketId);
    const { investible } = inv;
    const { group_id: investibleGroupId, stage: investibleStageId, assigned } = marketInfo || {};
    return investibleGroupId === groupId && !excluded.includes(investible.id) &&
      marketStageIds.includes(investibleStageId) && (!isAssignedToMe || assigned?.includes(userId));
  });
  const results = _.isEmpty(searchQuery) ? undefined : (getSearchResults(index, searchQuery) || []);
  const investiblesRaw = _.isEmpty(searchQuery) ? activeGroupInvestibles : activeGroupInvestibles.filter((inv) => {
    const { investible } = inv;
    return results.find((item) => item.id === investible.id);
  });
  const investibles = _.orderBy(investiblesRaw, [(investible) => {
    const marketInfo = getMarketInfo(investible, marketId);
    const { assigned } = marketInfo;
    if (assigned?.includes(userId)) {
      return 1;
    }
    return 0;
  }, (investible) => investible.investible.name], ['desc', 'asc']);

  const { investibleId } = formData;

  function onSearchChange(event) {
    const { value } = event.target
    setSearchQuery(value);
  }

  function toggleAssignedToMe() {
    setIsAssignedToMe(!isAssignedToMe);
  }

  function toggleActive() {
    setIsActive(!isActive);
  }

  function renderInvestibleItem(inv) {
    const { investible } = inv;
    const myInvestibleId = investible.id;
    const isChecked = investibleId === myInvestibleId;
    const marketInfo = getMarketInfo(inv, marketId);
    const { assigned } = marketInfo;
    const displayName = investible.name;
    const assignedPeople = marketPresences.filter((presence) => (assigned || []).includes(presence.id));
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
        <div style={{display: 'flex', alignItems: 'center'}}>
          <GravatarGroup users={assignedPeople} className={classes.gravatarStyle}/>
          <Typography style={{marginLeft: _.isEmpty(assigned) ? undefined : '1rem'}}>
            {displayName}
          </Typography>
        </div>
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
              placeholder="Search in this view"
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
          {intl.formatMessage({ id: 'searchActive' })}
          <Checkbox
            checked={isActive}
            onClick={toggleActive}
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