import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import Screen from '../../containers/Screen/Screen'
import { useHistory, useLocation } from 'react-router';
import {
  decomposeMarketPath,
  formMarketLink,
  makeBreadCrumbs,
} from '../../utils/marketIdPathFunctions'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import { getNotDoingStage, getVerifiedStage } from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { getInvestiblesInStage, getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'
import SubSection from '../../containers/SubSection/SubSection'
import { useIntl } from 'react-intl'
import ArchiveInvestbiles from './ArchiveInvestibles'
import { SECTION_TYPE_SECONDARY } from '../../constants/global'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences, getPresenceMap } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import AssigneeFilterDropdown from './AssigneeFilterDropdown'
import { Grid } from '@material-ui/core'
import CommentBox from '../../containers/CommentBox/CommentBox'
import MarketTodos from '../Dialog/Planning/MarketTodos'
import { REPLY_TYPE, TODO_TYPE } from '../../constants/comments'
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import AgilePlanIcon from '@material-ui/icons/PlaylistAdd'
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext'
import { getMarketInfo } from '../../utils/userFunctions'
import queryString from 'query-string'

function DialogArchives(props) {
  const { hidden } = props;

  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();
  const { pathname, search: querySearch } = location;
  const values = queryString.parse(querySearch);
  const { groupId } = values || {};
  const { marketId } = decomposeMarketPath(pathname);
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [filteredMarketId, setFilteredMarketId] = useState(undefined);
  const [marketsState] = useContext(MarketsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [commentsState] = useContext(CommentsContext);
  const [searchResults] = useContext(SearchResultsContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const presenceMap = getPresenceMap(marketPresences);
  const renderableMarket = getMarket(marketsState, marketId) || {};
  const verifiedStage = getVerifiedStage(marketStagesState, marketId) || {};
  const notDoingStage = getNotDoingStage(marketStagesState, marketId) || {};
  const marketInvestibles = getMarketInvestibles(investiblesState, marketId, searchResults) || [];
  const verifiedInvestibles = getInvestiblesInStage(marketInvestibles, verifiedStage.id, marketId);
  const notDoingInvestibles = getInvestiblesInStage(marketInvestibles, notDoingStage.id, marketId);
  const comments = getMarketComments(commentsState, marketId) || [];
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

  const { name } = renderableMarket;
  const breadCrumbTemplates = [{ name, link: formMarketLink(marketId, groupId), icon: <AgilePlanIcon/> }];
  const breadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates);

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

  if (!marketId) {
    return (
      <Screen
        hidden={hidden}
        tabTitle={intl.formatMessage({ id: 'dialogArchivesLabel' })}
      >
        Loading
      </Screen>
    );
  }

  return (
    <Screen
      hidden={hidden}
      title={intl.formatMessage({ id: 'dialogArchivesLabel' })}
      tabTitle={intl.formatMessage({ id: 'dialogArchivesLabel' })}
      breadCrumbs={breadCrumbs}
    >
      <SubSection
        type={SECTION_TYPE_SECONDARY}
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
      <SubSection
        type={SECTION_TYPE_SECONDARY}
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

DialogArchives.propTypes = {
  hidden: PropTypes.bool,
};

DialogArchives.defaultProps = {
  hidden: false,
};

export default DialogArchives;