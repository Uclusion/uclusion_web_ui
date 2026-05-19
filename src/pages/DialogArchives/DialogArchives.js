import React, { useContext, useEffect, useState } from 'react'
import _ from 'lodash'
import { useLocation } from 'react-router';
import { decomposeMarketPath } from '../../utils/marketIdPathFunctions'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import { getInReviewStage } from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import { getInvestiblesInStage, getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'
import SubSection from '../../containers/SubSection/SubSection'
import { useIntl } from 'react-intl'
import { SECTION_TYPE_SECONDARY_WARNING } from '../../constants/global'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import AssigneeFilterDropdown from './AssigneeFilterDropdown'
import { Box, FormControl, FormHelperText, Grid, IconButton, MenuItem, Select, Typography } from '@material-ui/core'
import { getMarketInfo } from '../../utils/userFunctions'
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext'
import queryString from 'query-string'
import Screen from '../../containers/Screen/Screen';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext';
import { getGroup } from '../../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { makeStyles } from '@material-ui/core/styles';
import { BacklogItem } from '../Dialog/Planning/Backlog';
import { PAGE_SIZE } from '../../components/Comments/BugListContext';
import { getPaginatedItems } from '../../utils/messageUtils';
import { KeyboardArrowLeft } from '@material-ui/icons';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';

const useStyles = makeStyles((theme) => ({
  label: { color: theme.palette.text.primary },
  select: {
    color: theme.palette.text.primary,
    '&:before': { borderColor: theme.palette.text.primary },
    '&:after': { borderColor: theme.palette.text.primary },
  },
  icon: { fill: theme.palette.text.primary },
}));

function DialogArchives() {
  const intl = useIntl();
  const location = useLocation();
  const classes = useStyles();
  const { pathname, search: querySearch } = location;
  const values = queryString.parse(querySearch);
  const { groupId: urlGroupId, assigneeId: urlAssigneeId } = values || {};
  const { marketId } = decomposeMarketPath(pathname);
  const [assigneeFilter, setAssigneeFilter] = useState(urlAssigneeId || '');
  const [groupFilter, setGroupFilter] = useState(urlGroupId || '');
  const [filteredMarketId, setFilteredMarketId] = useState(undefined);
  const [page, setPage] = useState(1);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [searchResults] = useContext(SearchResultsContext);
  const [groupState] = useContext(MarketGroupsContext);
  const group = getGroup(groupState, marketId, urlGroupId) || {};
  const allMarketGroups = (groupState[marketId] || []).filter((g) => !g.initializing);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const completeStage = getInReviewStage(marketStagesState, marketId) || {};
  const marketInvestiblesRaw = getMarketInvestibles(investiblesState, marketId, searchResults) || [];
  const marketInvestibles = marketInvestiblesRaw.filter((investible) => {
    const marketInfo = getMarketInfo(investible, marketId);
    if (_.isEmpty(groupFilter)) {
      return true;
    }
    return marketInfo.group_id === groupFilter;
  });
  const verifiedInvestibles = getInvestiblesInStage(marketInvestibles, completeStage.id, marketId);

  const filteredVerifiedInvestibles = verifiedInvestibles.filter((inv) => {
    if (_.isEmpty(assigneeFilter)) {
      return true;
    }
    const myInfo = getMarketInfo(inv, marketId);
    return myInfo && myInfo.assigned && myInfo.assigned.includes(assigneeFilter);
  });

  const { first, last, data, hasMore, hasLess } = getPaginatedItems(filteredVerifiedInvestibles, page, PAGE_SIZE);

  function onAssigneeChange(event) {
    const { value } = event.target;
    setAssigneeFilter(value);
    setFilteredMarketId(marketId);
    setPage(1);
  }

  function onGroupChange(event) {
    const { value } = event.target;
    setGroupFilter(value);
    setFilteredMarketId(marketId);
    setPage(1);
  }

  useEffect(() => {
    if (filteredMarketId && filteredMarketId !== marketId) {
      setFilteredMarketId(undefined);
      setAssigneeFilter('');
      setGroupFilter('');
      setPage(1);
    }
  }, [filteredMarketId, marketId]);

  if (!marketId) {
    return React.Fragment;
  }

  const sortedGroups = _.sortBy(allMarketGroups, 'name');

  return (
    <Screen
      title={intl.formatMessage({ id: 'completeJobsTitle' })}
      tabTitle={group.name ? `${group.name} - ${intl.formatMessage({ id: 'completeJobsTitle' })}` : intl.formatMessage({ id: 'completeJobsTitle' })}
    >
      <SubSection
        type={SECTION_TYPE_SECONDARY_WARNING}
        bolder
        title={intl.formatMessage({ id: 'dialogArchivesVerifiedHeader' })}
        id="verified"
        showCard={false}
        actionButton={
          <div style={{ display: 'flex', gap: '1rem' }}>
            <FormControl>
              <FormHelperText className={classes.label}>{intl.formatMessage({ id: 'viewFilterLabel' })}</FormHelperText>
              <Select
                value={groupFilter}
                displayEmpty
                onChange={onGroupChange}
                className={classes.select}
                inputProps={{ classes: { icon: classes.icon } }}
              >
                <MenuItem key="all" value="">
                  {intl.formatMessage({ id: 'viewFilterAll' })}
                </MenuItem>
                {sortedGroups.map((g) => (
                  <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <AssigneeFilterDropdown
              onChange={onAssigneeChange}
              presences={marketPresences}
              value={assigneeFilter}
            />
          </div>
        }
      >
        {_.isEmpty(filteredVerifiedInvestibles) ? (
          <Typography style={{ marginTop: '2rem', marginLeft: '0.5rem' }} variant="body1">
            {intl.formatMessage({ id: 'completeJobsTitle' })} is empty.
          </Typography>
        ) : (
          <>
            <div style={{ paddingBottom: '0.25rem', paddingTop: '0.5rem' }}>
              <div style={{ display: 'flex', width: '80%' }}>
                <div style={{ flexGrow: 1 }} />
                <Box fontSize={14} color="text.secondary">
                  {first} - {last} of {_.size(filteredVerifiedInvestibles)}
                  <IconButton disabled={!hasLess} onClick={() => setPage(page - 1)}>
                    <KeyboardArrowLeft />
                  </IconButton>
                  <IconButton disabled={!hasMore} onClick={() => setPage(page + 1)}>
                    <KeyboardArrowRight />
                  </IconButton>
                </Box>
              </div>
            </div>
            {data.map((inv) => (
              <BacklogItem
                key={inv.investible.id}
                inv={inv}
                comments={[]}
                marketPresences={marketPresences}
                marketId={marketId}
              />
            ))}
          </>
        )}
      </SubSection>
      <Grid item xs={12} style={{ height: '5rem' }} />
    </Screen>
  );
}

export default DialogArchives;
