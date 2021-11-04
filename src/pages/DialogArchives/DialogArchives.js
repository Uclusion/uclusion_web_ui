import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import Screen from '../../containers/Screen/Screen'
import { useHistory, useLocation } from 'react-router';
import {
  baseNavListItem,
  decomposeMarketPath, formMarketArchivesLink,
  formMarketLink,
  makeArchiveBreadCrumbs,
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
import { ACTIVE_STAGE } from '../../constants/markets'
import MarketLinks from '../Dialog/MarketLinks'
import { Grid } from '@material-ui/core'
import CommentBox, { getSortedRoots } from '../../containers/CommentBox/CommentBox'
import MarketTodos from '../Dialog/Planning/MarketTodos'
import { QUESTION_TYPE, REPLY_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../constants/comments'
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import AgilePlanIcon from '@material-ui/icons/PlaylistAdd'
import WorkIcon from '@material-ui/icons/Work'
import ListAltIcon from '@material-ui/icons/ListAlt'
import QuestionIcon from '@material-ui/icons/ContactSupport'
import UpdateIcon from '@material-ui/icons/Update'
import ChangeSuggstionIcon from '@material-ui/icons/ChangeHistory'
import GavelIcon from '@material-ui/icons/Gavel'
import { getFakeCommentsArray } from '../../utils/stringFunctions'
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext'
import MenuBookIcon from '@material-ui/icons/MenuBook'

function DialogArchives(props) {
  const { hidden } = props;

  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();
  const { pathname } = location;
  const { marketId } = decomposeMarketPath(pathname);
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [filteredMarketId, setFilteredMarketId] = useState(undefined);
  const [marketsState] = useContext(MarketsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [commentsState] = useContext(CommentsContext);
  const [searchResults] = useContext(SearchResultsContext);
  const [marketInfoList, setMarketInfoList] = useState(undefined);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || []
  const myPresence = marketPresences.find((presence) => presence.current_user);
  const presenceMap = getPresenceMap(marketPresencesState, marketId);
  const renderableMarket = getMarket(marketsState, marketId) || {};
  const verifiedStage = getVerifiedStage(marketStagesState, marketId) || {};
  const notDoingStage = getNotDoingStage(marketStagesState, marketId) || {};
  const marketInvestibles = getMarketInvestibles(investiblesState, marketId, searchResults) || [];
  const verifiedInvestibles = getInvestiblesInStage(marketInvestibles, verifiedStage.id);
  const notDoingInvestibles = getInvestiblesInStage(marketInvestibles, notDoingStage.id);
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
    const { market_infos } = inv;
    const myInfo = market_infos.find((element) => element.market_id === marketId);
    return myInfo && myInfo.assigned.includes(assigneeFilter);
  });

  const { name, market_stage: marketStage, children } = renderableMarket;
  const inArchives = marketStage !== ACTIVE_STAGE || (myPresence && !myPresence.following);
  const breadCrumbTemplates = [{ name, link: formMarketLink(marketId), icon: <AgilePlanIcon/> }];
  const breadCrumbs = inArchives? makeArchiveBreadCrumbs(history, breadCrumbTemplates)
    : makeBreadCrumbs(history, breadCrumbTemplates);

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
        Not Ready
      </Screen>
    );
  }

  function createNavListItem(icon, textId, anchorId, howManyNum, alwaysShow) {
    return baseNavListItem(formMarketArchivesLink(marketId), icon, textId, anchorId, howManyNum, alwaysShow);
  }

  const sortedRoots = getSortedRoots(resolvedMarketComments, searchResults);
  const questions = sortedRoots.filter((comment) => comment.comment_type === QUESTION_TYPE);
  const { id: questionId } = getFakeCommentsArray(questions)[0];
  const suggestions = sortedRoots.filter((comment) => comment.comment_type === SUGGEST_CHANGE_TYPE);
  const { id: suggestId } = getFakeCommentsArray(suggestions)[0];
  const reports = sortedRoots.filter((comment) => comment.comment_type === REPORT_TYPE);
  const { id: reportId } = getFakeCommentsArray(reports)[0];
  const inactiveChildrenDialogs = marketInfoList || []
  const navigationMenu = {
    navHeaderIcon: MenuBookIcon, navToolLink: 'https://documentation.uclusion.com/initiatives-and-dialogs/dialogs',
    navListItemTextArray: [
      createNavListItem(AgilePlanIcon, 'planningVerifiedStageLabel', 'verified',
        _.size(verifiedInvestibles)),
      createNavListItem(WorkIcon, 'planningNotDoingStageLabel', 'notDoing', _.size(notDoingInvestibles)),
      createNavListItem(ListAltIcon, 'todoSection', 'marketTodos', _.size(todoComments)),
      createNavListItem(QuestionIcon, 'questions', `c${questionId}`, _.size(questions)),
      createNavListItem(UpdateIcon, 'reports', `c${reportId}`, _.size(reports)),
      createNavListItem(ChangeSuggstionIcon, 'suggestions', `c${suggestId}`, _.size(suggestions)),
      createNavListItem(GavelIcon, 'dialogs', 'dia0', _.size(inactiveChildrenDialogs))
    ]
  }

  return (
    <Screen
      hidden={hidden}
      title={intl.formatMessage({ id: 'dialogArchivesLabel' })}
      tabTitle={intl.formatMessage({ id: 'dialogArchivesLabel' })}
      breadCrumbs={breadCrumbs}
      navigationOptions={navigationMenu}
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
      <MarketTodos comments={todoComments} marketId={marketId} isInArchives sectionOpen={true} />
      <MarketLinks links={children || []} isArchive setMarketInfoList={setMarketInfoList} />
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