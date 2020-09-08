import React, { useContext, useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'
import Header from '../../containers/Header'
import { formMarketLink, navigate, } from '../../utils/marketIdPathFunctions'
import { toastError } from '../../utils/userMessage'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { makeStyles } from '@material-ui/styles'
import _ from 'lodash'
import { addMarketToStorage } from '../../contexts/MarketsContext/marketsContextHelper'
import { AccountUserContext } from '../../contexts/AccountUserContext/AccountUserContext'
import { PLANNING_TYPE } from '../../constants/markets'
import { createPlanning } from '../../api/markets'
import { addParticipants } from '../../api/users'
import config from '../../config'
import { addPlanningInvestible, stageChangeInvestible } from '../../api/investibles'
import { addInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { DiffContext } from '../../contexts/DiffContext/DiffContext'
import { pushMessage } from '../../utils/MessageBusUtils'
import { PUSH_STAGE_CHANNEL, VERSIONS_EVENT } from '../../contexts/VersionsContext/versionsContextHelper'
import { addPresenceToMarket } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { saveComment } from '../../api/comments'
import { TODO_TYPE } from '../../constants/comments'
import LoadingDisplay from '../../components/LoadingDisplay';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  container: {
    background: '#efefef',
    padding: '46px 20px 156px',
  },
  containerAll: {
    background: '#efefef',
    padding: '24px 20px 156px',
    marginTop: '80px',
    width: '100%',
    [theme.breakpoints.down('sm')]: {
      padding: '24px 12px 156px',
    },
  },
  actionContainer: {
    marginBottom: '-6rem'
  },
  content: {
    background: '#efefef',
  },
  elevated: {
    zIndex: 99,
  },
}));

function ECPInvite(props) {
  const { hidden, utm } = props;
  const intl = useIntl();
  const history = useHistory();
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [userState] = useContext(AccountUserContext);
  const { user } = userState;
  const { name } = user || {};
  const classes = useStyles();
  // TODO - Don't have a video specific to angencies yet
  const storyLevelVideo = utm === 'founders' ? 'https://www.youtube.com/embed/3t7uzNGUxFk?showinfo=0'
    : 'https://www.youtube.com/embed/v5QdMpnNr2M?showinfo=0';
  useEffect(() => {
    function createECPMarket(myName) {
      let createdMarketId;
      let myUserId;
      let inVotingStage;
      let inProgressStage;
      let inReviewStage;
      const addInfo = {
        name: intl.formatMessage({ id: 'ecpWorkspace' }, { x: myName}),
        market_type: PLANNING_TYPE,
        description: '<p>Edit this description to list gaps for adopting Uclusion.</p><p><iframe allowfullscreen="true" class="ql-video" frameborder="0" src="https://www.youtube.com/embed/NHGM66oeIMU?showinfo=0"></iframe></p>',
      };
      return createPlanning(addInfo)
        .then((marketDetails) => {
          const {
            market,
            presence,
            stages,
          } = marketDetails;
          createdMarketId = market.id;
          myUserId = presence.id;
          addMarketToStorage(marketsDispatch, diffDispatch, market);
          pushMessage(PUSH_STAGE_CHANNEL, { event: VERSIONS_EVENT, marketId: createdMarketId, stages });
          addPresenceToMarket(presenceDispatch, createdMarketId, presence);
          inVotingStage = stages.find((stage) => stage.allows_investment);
          inProgressStage = stages.find((stage) => stage.singular_only);
          inReviewStage = stages.find((stage) => (!stage.allows_investment && stage.appears_in_context
            && !stage.singular_only && !stage.allows_issues));
          return addParticipants(createdMarketId, [{
            user_id: config.support_user_id,
            account_id: config.support_account_id,
            is_observer: false,
          }]).then((users) => {
            const uclusionUser = users[0];
            const storyAddInfo = {
              marketId: createdMarketId,
              name: intl.formatMessage({ id: 'ecpUclusionStoryName' }),
              description: `<p>See <iframe allowfullscreen="true" class="ql-video" frameborder="0" src="${storyLevelVideo}"></iframe> for an explanation of how to use Uclusion. You can ask questions in this story.</p>`,
              assignments: [uclusionUser.id],
            };
            return addPlanningInvestible(storyAddInfo);
          }).then((investible) => {
            const investibleId = investible.investible.id;
            const updateInfo = {
              marketId: createdMarketId,
              investibleId,
              stageInfo: {
                current_stage_id: inVotingStage.id,
                stage_id: inReviewStage.id,
              }
            };
            return stageChangeInvestible(updateInfo);
          }).then((investible) => {
              addInvestible(investiblesDispatch, diffDispatch, investible);
              const storyAddInfo = {
                marketId: createdMarketId,
                name: intl.formatMessage({ id: 'ecpToolsStoryName' }),
                description: '<p>Edit this story to list the tools you use for asynchronous communications and project management and some information about how you use them.</p>',
                assignments: [myUserId],
              };
              return addPlanningInvestible(storyAddInfo);
            }).then((investible) => {
              const investibleId = investible.investible.id;
              const updateInfo = {
                marketId: createdMarketId,
                investibleId,
                stageInfo: {
                  current_stage_id: inVotingStage.id,
                  stage_id: inProgressStage.id,
                }
              };
            return stageChangeInvestible(updateInfo);
          }).then((investible) => {
            addInvestible(investiblesDispatch, diffDispatch, investible);
            const storyAddInfo = {
              marketId: createdMarketId,
              name: intl.formatMessage({ id: 'ecpNextStoryName' }),
              description: '<p>Create your own Workspace and/or schedule a meeting with us <a href="https://calendly.com/uclusion/walk-through">here</a>.</p>',
              assignments: [myUserId],
            };
            return addPlanningInvestible(storyAddInfo);
          }).then((investible) => {
            addInvestible(investiblesDispatch, diffDispatch, investible);
            return saveComment(createdMarketId, undefined, undefined, 'Please consider inviting co-workers to this Workspace.', TODO_TYPE);
          }).then(() => createdMarketId);
        });
    }
    if (!hidden && !_.isEmpty(name)) {
      createECPMarket(name)
        .then((id) => {
          navigate(history, formMarketLink(id));
        })
        .catch((error) => {
          console.error(error);
          toastError('errorMarketFetchFailed');
        });
    }
  }, [name, hidden, history, marketsDispatch, intl, diffDispatch, presenceDispatch, investiblesDispatch,
    storyLevelVideo]);

  if (hidden) {
    return <React.Fragment/>
  }
  
  return (
    <div>
    <Helmet
      defer={false}
    >
      <title>{intl.formatMessage({ id: 'loadingMarket' })}</title>
    </Helmet>)
    <Header
      title={intl.formatMessage({ id: 'loadingMarket' })}
      breadCrumbs={[]}
      toolbarButtons={[]}
      hidden={hidden}
      appEnabled
      logoLinkDisabled
      hideTools
    />
    <div className={classes.content}>
      <div>LLL1</div>
      <LoadingDisplay showMessage={true} messageId="OnboardingCreatingCustomWorkspace" />
    </div>
  </div>
  );
}

ECPInvite.propTypes = {
  hidden: PropTypes.bool,
  utm: PropTypes.string.isRequired,
};

ECPInvite.defaultProps = {
  hidden: false,
};

export default ECPInvite;
