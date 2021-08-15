import React, { useContext } from 'react'
import { useIntl } from 'react-intl'
import PropTypes from 'prop-types';
import { Announcement, PlayArrow } from '@material-ui/icons'
import SpinningIconLabelButton from '../Buttons/SpinningIconLabelButton'
import { INVITE_STORIES_WORKSPACE_FIRST_VIEW } from '../../contexts/TourContext/tourContextHelper'
import { TourContext } from '../../contexts/TourContext/TourContext'
import _ from 'lodash';
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import { startTour } from '../../contexts/TourContext/tourContextReducer'
import { Card, CardActions, CardContent } from '@material-ui/core'
import { createOnboardingWorkspace } from '../../api/markets'
import { updateStagesForMarket } from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { refreshInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { DiffContext } from '../../contexts/DiffContext/DiffContext'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { addPresenceToMarket } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { refreshMarketComments } from '../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import TokenStorageManager, { TOKEN_TYPE_MARKET } from '../../authorization/TokenStorageManager'

const myStyles = makeStyles(
  () => {
    return {
      root: {
        maxWidth: '40rem',
        padding: '2rem',
        marginLeft: 'auto',
        marginRight: 'auto'
      },
      rootHidden: {
        display: 'none'
      },
      warningTitleIcon: {
        marginRight: 8,
        color: '#F2C94C',
      },
    };
  },
  { name: "LockedDialog" }
);

function CreateWorkspaceDialog(props) {
  const { user, hidden } = props;
  const history = useHistory();
  const intl = useIntl();
  const classes = myStyles();
  const { name } = user;
  const [, tourDispatch] = useContext(TourContext);
  const [, marketStagesDispatch] = useContext(MarketStagesContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [, commentsDispatch] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);

  function onCreate() {
    let marketId;
    return createOnboardingWorkspace().then((results) => {
      let promiseChain = Promise.resolve(true);
      const tokenStorageManager = new TokenStorageManager();
      results.forEach((marketResult) => {
        const { market, stages, investibles, comments, users, token } = marketResult;
        updateStagesForMarket(marketStagesDispatch, market.id, stages);
        refreshInvestibles(investiblesDispatch, diffDispatch, investibles);
        users.forEach((user) => addPresenceToMarket(presenceDispatch, market.id, user));
        if (!_.isEmpty(comments)) {
          refreshMarketComments(commentsDispatch, market.id, comments);
        }
        if (market.market_sub_type === 'REQUIREMENTS') {
          marketId = market.id;
        }
        promiseChain = promiseChain.then(() => tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, market.id, token));
      });
      tourDispatch(startTour(INVITE_STORIES_WORKSPACE_FIRST_VIEW));
      return promiseChain.then(() => {
        setOperationRunning(false);
        navigate(history, formMarketLink(marketId));
      });
    });
  }

  return (
    <Card className={hidden ? classes.rootHidden : classes.root} elevation={3}>
      <CardContent>
        <Typography gutterBottom variant="h5" component="h2">
          <Announcement className={classes.warningTitleIcon} />
          {intl.formatMessage({ id: 'createWorkspaceGreeting' }, { name })}
        </Typography>
        <Typography component='p' style={{paddingTop: '2rem'}}>
          {intl.formatMessage({ id: 'createWorkspaceContent' })}
          <b>{intl.formatMessage({id: 'createWorkspaceContentBold'})}</b>
        </Typography>
      </CardContent>
      <CardActions>
        <div style={{marginLeft: 'auto', marginRight: 'auto'}}>
          <SpinningIconLabelButton onClick={onCreate} icon={PlayArrow} style={{padding: '0.75rem'}}
                                   id="createTemplateWorkspaceButton">
            <Typography component='h6'>
              {intl.formatMessage({ id: 'createWorkspaceStart' })}
            </Typography>
          </SpinningIconLabelButton>
        </div>
      </CardActions>
    </Card>
  );
}

CreateWorkspaceDialog.propTypes = {
  user: PropTypes.object.isRequired,
};

export default CreateWorkspaceDialog;