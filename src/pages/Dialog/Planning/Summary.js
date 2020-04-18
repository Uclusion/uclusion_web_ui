import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { FormattedMessage, useIntl } from 'react-intl'
import { Card, CardActions, CardContent, Divider, Typography, } from '@material-ui/core'
import _ from 'lodash'
import { makeStyles } from '@material-ui/styles'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import {
  getMarketPresences,
  marketHasOnlyCurrentUser
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import DialogActions from '../../Home/DialogActions'
import DescriptionOrDiff from '../../../components/Descriptions/DescriptionOrDiff'
import CardType, { AGILE_PLAN_TYPE, DECISION_TYPE } from '../../../components/CardType'
import { DaysEstimate } from '../../../components/AgilePlan'
import ParentSummary from '../ParentSummary'
import MarketLinks from '../MarketLinks'
import clsx from 'clsx'
import { useMetaDataStyles } from '../../Investible/Planning/PlanningInvestible'
import InsertLinkIcon from '@material-ui/icons/InsertLink'
import { navigate } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import ExpandableAction from '../../../components/SidebarActions/Planning/ExpandableAction'
import Collaborators from '../Collaborators'
import ViewArchiveActionButton from './ViewArchivesActionButton'

const useStyles = makeStyles(theme => ({
  root: {
    alignItems: "flex-start",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  actions: {},
  content: {
    flexBasis: "100%",
    padding: theme.spacing(0, 4)
  },
  divider: {
    marginBottom: theme.spacing(3)
  },
  fieldset: {
    border: "none",
    display: "inline-block",
    padding: theme.spacing(0),
    "& > *": {
      marginLeft: theme.spacing(3),
      "&:first-child": {
        marginLeft: 0,
      }
    }
  },
  type: {
    display: "inline-flex"
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: "42px",
    paddingBottom: "9px",
    [theme.breakpoints.down("xs")]: {
      fontSize: 25
    }
  },
  draft: {
    color: "#E85757"
  }
}));

function Summary(props) {
  const { market, investibleId, hidden, unassigned, isChannel, activeMarket } = props;
  const history = useHistory();
  const intl = useIntl();
  const classes = useStyles();
  const {
    id,
    name,
    description,
    market_stage: marketStage,
    market_type: marketType,
    days_estimate: daysEstimate,
    parent_market_id: parentMarketId,
    parent_investible_id: parentInvestibleId,
    created_at: createdAt,
    children,
  } = market;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, id) || [];
  const isDraft = marketHasOnlyCurrentUser(marketPresencesState, id);
  const myPresence =
    marketPresences.find(presence => presence.current_user) || {};
  const metaClasses = useMetaDataStyles();

  return (
    <Card className={classes.root} id="summary">
      <CardType className={classes.type} type={AGILE_PLAN_TYPE} />
      <CardActions className={classes.actions}>
        <DialogActions
          isAdmin={myPresence.is_admin}
          isFollowing={myPresence.following}
          marketStage={marketStage}
          marketType={marketType}
          parentMarketId={parentMarketId}
          parentInvestibleId={parentInvestibleId}
          marketId={id}
          initiativeId={investibleId}
        />
      </CardActions>
      <CardContent className={classes.content}>
        {isDraft && activeMarket && (
          <Typography className={classes.draft}>
            {intl.formatMessage({ id: "draft" })}
          </Typography>
        )}
        {!activeMarket && (
          <Typography className={classes.draft}>
            {intl.formatMessage({ id: "inactive" })}
          </Typography>
        )}
        <Typography className={classes.title} variant="h3" component="h1">
          {name}
        </Typography>
        <DescriptionOrDiff id={id} description={description} />
        <Divider className={classes.divider} />
        {!isChannel && (
          <dl className={metaClasses.root}>
            <div className={clsx(metaClasses.group, metaClasses.assignments)}>
              <ViewArchiveActionButton key="archives" marketId={id} />
            </div>
            {daysEstimate && (
              <fieldset className={classes.fieldset}>
                <DaysEstimate readOnly value={daysEstimate} createdAt={createdAt} />
              </fieldset>
            )}
          </dl>
        )}
        {!(_.isEmpty(unassigned) && _.isEmpty(children) && !market.parent_market_id) && (
          <dl className={metaClasses.root}>
            {!_.isEmpty(unassigned) && (
              <div className={clsx(metaClasses.group, metaClasses.assignments)}>
                <dt>
                  <FormattedMessage id="dialogParticipants" />
                </dt>
                <dd>
                  <Collaborators
                    marketPresences={marketPresences}
                    intl={intl}
                    marketId={id}
                    history={history}
                  />
                </dd>
              </div>
            )}
            <ParentSummary market={market} hidden={hidden}/>
            <MarketLinks links={children || []} hidden={hidden} actions={[<ExpandableAction
              id="link"
              key="link"
              icon={<InsertLinkIcon />}
              openLabel={intl.formatMessage({ id: "planningInvestibleDecision" })}
              label={intl.formatMessage({ id: "childDialogExplanation" })}
              onClick={() =>
                navigate(history, `/dialogAdd#type=${DECISION_TYPE}&id=${id}`)
              }
            />]} />
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

Summary.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  investibleName: PropTypes.string,
  investibleDescription: PropTypes.string,
  investibleId: PropTypes.string,
  hidden: PropTypes.bool.isRequired,
  isChannel: PropTypes.bool.isRequired,
  activeMarket: PropTypes.bool.isRequired,
  unassigned: PropTypes.array
};

Summary.defaultProps = {
  investibleName: undefined,
  investibleDescription: undefined,
  investibleId: undefined,
  unassigned: []
};

export default Summary;
