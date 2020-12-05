import React, { useContext, useEffect, useState } from 'react'
import _ from 'lodash'
import { useHistory, useLocation } from 'react-router';
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import { useIntl } from 'react-intl'
import {
  decomposeMarketPath,
  formInvestibleLink,
  formMarketArchivesLink,
  formMarketLink,
  navigate,
} from '../../utils/marketIdPathFunctions'
import Screen from '../../containers/Screen/Screen'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'
import DecisionDialog from './Decision/DecisionDialog'
import PlanningDialog from './Planning/PlanningDialog'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { getComment, getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import { getStages } from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { ACTIVE_STAGE, DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets'
import { getMarketFromUrl } from '../../api/uclusionClient'
import { pollForMarketLoad } from '../../api/versionedFetchUtils'
import { toastError } from '../../utils/userMessage'

const styles = (theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  toolbar: {
    width: '100%',
    display: 'flex',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  toolbarButton: {
    margin: theme.spacing(1),
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  hidden: {
    display: 'none',
  },
  dialog: {},
  stageSelector: {
    display: 'flex',
    alignItems: 'center',
    margin: theme.spacing(),
    marginTop: theme.spacing(2),
    width: 384,
    [theme.breakpoints.only('xs')]: {
      width: '100%',
    },
  },
});

function Dialog(props) {
  const { hidden } = props;
  const [addInvestibleMode, setAddInvestibleMode] = useState(false);
  const history = useHistory();
  const intl = useIntl();
  const location = useLocation();
  const { pathname, hash } = location
  const myHashFragment = (hash && hash.length > 1) ? hash.substring(1, hash.length) : undefined
  const { marketId } = decomposeMarketPath(pathname)
  const [marketsState] = useContext(MarketsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState] = useContext(CommentsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const investibles = getMarketInvestibles(investiblesState, marketId);
  const comments = getMarketComments(commentsState, marketId);
  const loadedMarket = getMarket(marketsState, marketId);
  const renderableMarket = loadedMarket || {};
  const { market_type: marketType, parent_comment_market_id: parentMarketId, parent_comment_id: parentCommentId,
    market_stage: marketStage } = renderableMarket || '';
  const isInline = !_.isEmpty(parentCommentId);
  const inlineComments = getMarketComments(commentsState, parentMarketId || marketId) || [];
  const parentComment = inlineComments.find((comment) => comment.id === parentCommentId) || {};
  const parentInvestibleId = parentComment.investible_id;
  const activeMarket = marketStage === ACTIVE_STAGE;
  const isInitialization = marketsState.initializing || investiblesState.initializing || marketPresencesState.initializing || marketStagesState.initializing;
  const marketStages = getStages(marketStagesState, marketId);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = marketPresences && marketPresences.find((presence) => presence.current_user);
  const loading = !myPresence || !marketType || marketType === INITIATIVE_TYPE || (isInline && activeMarket);

  useEffect(() => {
    if (!hidden && _.isEmpty(loadedMarket) && !isInitialization) {
      // Login with market id to create guest capability if necessary
      getMarketFromUrl(marketId).then((loginData) =>{
        const { market } = loginData;
        const { id } = market;
        return pollForMarketLoad(id);
      }).catch((error) => {
        console.error(error);
        toastError('errorMarketFetchFailed');
      });
    }

    return () => {
    };
  }, [hidden, marketId, isInitialization, loadedMarket]);

  useEffect(() => {
    function getInitiativeInvestible(baseInvestible) {
      const {
        investibleId: onInvestibleId,
      } = decomposeMarketPath(location.pathname);
      if (onInvestibleId) {
        return;
      }
      const { investible } = baseInvestible;
      const { id } = investible;
      const link = formInvestibleLink(marketId, id);
      navigate(history, link, true);
    }
    if (!hidden) {
      if (isInline) {
        const link = parentInvestibleId ? formInvestibleLink(parentMarketId, parentInvestibleId) :
          formMarketLink(parentMarketId);
        const fullLink = `${link}#c${parentCommentId}`;
        navigate(history, fullLink, true);
      }
      else if (marketType === INITIATIVE_TYPE) {
        if (Array.isArray(investibles) && investibles.length > 0) {
          getInitiativeInvestible(investibles[0])
        }
      } else if (marketType === PLANNING_TYPE && myHashFragment) {
        if (!myHashFragment.startsWith('cv') && myHashFragment.startsWith('c')) {
          const commentId = myHashFragment.substr(1)
          const comment = getComment(commentsState, marketId, commentId) || {}
          const { resolved, investible_id: investibleId } = comment
          if (resolved && !investibleId) {
            const link = formMarketArchivesLink(marketId)
            const fullLink = `${link}#c${commentId}`
            navigate(history, fullLink, true)
          }
        }
      }
    }

    return () => {
    }
  }, [hidden, marketType, investibles, marketId, history, location, marketStages, marketPresences, isInline,
    parentMarketId, parentInvestibleId, parentCommentId, myHashFragment, commentsState]);

  if (loading) {
    return (
      <Screen
        hidden={hidden}
        loading={loading}
        title={intl.formatMessage({ id: 'loadingMessage' })}
        tabTitle={intl.formatMessage({ id: 'loadingMessage' })}
      >
        <div />
      </Screen>
    );
  }

  return (
    <>
      {marketType === DECISION_TYPE && myPresence && (
        <DecisionDialog
          hidden={hidden}
          addInvestibleMode={addInvestibleMode}
          setAddInvestibleMode={setAddInvestibleMode}
          market={renderableMarket}
          investibles={investibles}
          comments={comments}
          marketStages={marketStages}
          marketPresences={marketPresences}
          myPresence={myPresence}
        />
      )}
      {marketType === PLANNING_TYPE && (
        <PlanningDialog
          hidden={hidden}
          addInvestibleMode={addInvestibleMode}
          setAddInvestibleMode={setAddInvestibleMode}
          market={renderableMarket}
          investibles={investibles}
          comments={comments}
          marketStages={marketStages}
          marketPresences={marketPresences}
          myPresence={myPresence}
        />
      )}
    </>
  );
}

Dialog.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default withStyles(styles)(Dialog);
