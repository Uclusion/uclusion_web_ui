import React, { useContext, useEffect, useState } from 'react'
import _ from 'lodash'
import { useLocation } from 'react-router';
import { decomposeMarketPath } from '../../utils/marketIdPathFunctions'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import { getInReviewStage, getNotDoingStage } from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import { getInvestiblesInStage, getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'
import SubSection from '../../containers/SubSection/SubSection'
import { useIntl } from 'react-intl'
import ArchiveInvestbiles from './ArchiveInvestibles'
import { SECTION_TYPE_SECONDARY_WARNING } from '../../constants/global'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences, getPresenceMap } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import AssigneeFilterDropdown from './AssigneeFilterDropdown'
import { Grid } from '@material-ui/core'
import CommentBox from '../../containers/CommentBox/CommentBox'
import MarketTodos from '../Dialog/Planning/MarketTodos'
import { REPLY_TYPE, TODO_TYPE } from '../../constants/comments'
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext'
import { getMarketInfo } from '../../utils/userFunctions'
import queryString from 'query-string'
import Screen from '../../containers/Screen/Screen';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext';
import { getGroup } from '../../contexts/MarketGroupsContext/marketGroupsContextHelper';

function DialogArchives() {
  const intl = useIntl();
  const location = useLocation();
  const { pathname, search: querySearch } = location;
  const values = queryString.parse(querySearch);
  const { groupId } = values || {};
  const { marketId } = decomposeMarketPath(pathname);
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [filteredMarketId, setFilteredMarketId] = useState(undefined);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [commentsState] = useContext(CommentsContext);
  const [searchResults] = useContext(SearchResultsContext);
  const [groupState] = useContext(MarketGroupsContext);
  const group = getGroup(groupState, marketId, groupId) || {};
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const presenceMap = getPresenceMap(marketPresences);
  const completeStage = getInReviewStage(marketStagesState, marketId) || {};
  const notDoingStage = getNotDoingStage(marketStagesState, marketId) || {};
  const marketInvestibles = getMarketInvestibles(investiblesState, marketId, searchResults) || [];
  const verifiedInvestibles = getInvestiblesInStage(marketInvestibles, completeStage.id, marketId);
  const notDoingInvestibles = getInvestiblesInStage(marketInvestibles, notDoingStage.id, marketId);
  const comments = getMarketComments(commentsState, marketId, groupId) || [];
  const resolvedMarketComments = comments.filter(comment => !comment.investible_id && comment.resolved) || [];
  const notTodoComments = resolvedMarketComments.filter(comment => comment.comment_type !== TODO_TYPE);
  const todoComments = comments.filter(comment => {
    if (comment.comment_type === TODO_TYPE) {
      return !comment.investible_id && comment.resolved;
    }
    //Just return all replies also because market todos component needs them
    return comment.comment_type === REPLY_TYPE;
  });

  const filteredVerifiedInvestibles = verifiedInvestibles.filter((inv) => {
    if (_.isEmpty(assigneeFilter)) {
      return true;
    }
    const myInfo = getMarketInfo(inv, marketId);
    return myInfo && myInfo.assigned && myInfo.assigned.includes(assigneeFilter);
  });

  function onFilterChange(event) {
    const { value } = event.target;
    setAssigneeFilter(value);
    setFilteredMarketId(marketId);
  }

  useEffect(() => {
    if (filteredMarketId && filteredMarketId !== marketId) {
      setFilteredMarketId(undefined);
      setAssigneeFilter('');
    }
  }, [filteredMarketId, marketId]);

  if (!marketId || !groupId) {
    return React.Fragment;
  }

  return (
    <Screen
      title={`${group.name} Settings`}
      tabTitle={`${group.name} Settings`}
    >
      <SubSection
        type={SECTION_TYPE_SECONDARY_WARNING}
        bolder
        title={intl.formatMessage({ id: 'dialogArchivesVerifiedHeader' })}
        id="verified"
        actionButton={
          (<AssigneeFilterDropdown
            onChange={onFilterChange}
            presences={marketPresences}
            value={assigneeFilter}
          />)}
      >
        <ArchiveInvestbiles
          marketId={marketId}
          investibles={filteredVerifiedInvestibles}
          presenceMap={presenceMap}
          comments={comments}
          elevation={0}
        />
      </SubSection>
      <div style={{paddingBottom: '1rem'}} />
      <SubSection
        type={SECTION_TYPE_SECONDARY_WARNING}
        bolder
        id="notDoing"
        title={intl.formatMessage({ id: 'dialogArchivesNotDoingHeader' })}
        style={{marginTop: '16px'}}
      >
        <ArchiveInvestbiles
          comments={comments}
          marketId={marketId}
          presenceMap={presenceMap}
          investibles={notDoingInvestibles}
          elevation={0}
        />
      </SubSection>
      <MarketTodos comments={todoComments} marketId={marketId} groupId={groupId} isInArchives sectionOpen={true} />
      <Grid container spacing={2}>
        <Grid item id="commentAddArea"  xs={12} style={{ marginTop: '15px' }}>
          <CommentBox comments={notTodoComments} marketId={marketId} allowedTypes={[]} />
        </Grid>
      </Grid>
    </Screen>
  );
}

export default DialogArchives;