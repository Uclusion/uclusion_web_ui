import React, { useContext, useEffect, useState } from 'react'
import _ from 'lodash'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import CardHeader from '@material-ui/core/CardHeader'
import PlanningIdeas from './PlanningIdeas'
import { useInvestiblesByPersonStyles } from './PlanningDialog'
import { getUserInvestibles } from './userUtils'
import PropTypes from 'prop-types'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences, getPresenceMap } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import {
  getInvestiblesInStage,
  getMarketInvestibles
} from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { ACTIVE_STAGE } from '../../../constants/markets'
import {
  getAcceptedStage,
  getBlockedStage,
  getInCurrentVotingStage,
  getInReviewStage,
  getRequiredInputStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { Avatar, Button, Menu, MenuItem } from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { ACTION_BUTTON_COLOR } from '../../../components/Buttons/ButtonConstants'
import { useIntl } from 'react-intl'
import { extractUsersList, hasNotVoted } from '../../../utils/userFunctions'
import SubSection from '../../../containers/SubSection/SubSection'
import { SECTION_TYPE_SECONDARY_WARNING } from '../../../constants/global'
import ArchiveInvestbiles from '../../DialogArchives/ArchiveInvestibles'
import Link from '@material-ui/core/Link'
import { formMarketLink, navigate } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import md5 from 'md5'

function InvestiblesByWorkspace(props) {
  const {
    workspaces
  } = props;
  const intl = useIntl();
  const history = useHistory();
  const classes = useInvestiblesByPersonStyles();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [commentsState] = useContext(CommentsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [chosenPerson, setChosenPerson] = React.useState({name:'', domain:'', external_id: ''});
  // For security reasons you can't access source data while being dragged in case you are not the target website
  const [beingDraggedHack, setBeingDraggedHack] = useState({});
  const activeWorkspaces = (workspaces || []).filter((market) => market.market_stage === ACTIVE_STAGE);
  const people = Object.entries(extractUsersList(marketPresencesState, undefined, activeWorkspaces, false));
  const sortedPeople = _.sortBy(people, [function(o) {
    const {
      current_user: currentUser
    } = o[1];
    return currentUser;
  }]);
  const peopleChoices = [sortedPeople.map((entry) => renderParticipantEntry(entry))];
  useEffect(() => {
    if ((!chosenPerson || chosenPerson.external_id === '') && !_.isEmpty(sortedPeople)) {
      setChosenPerson(sortedPeople[0][1])
    }
    return () => {};
  }, [chosenPerson, sortedPeople]);

  function handleClick(event) {
    setAnchorEl(event.currentTarget);
  }
  function handleClose() {
    setAnchorEl(null);
  }
  function renderParticipantEntry (presenceEntry) {
    const {
      name, domain, external_id: externalId
    } = presenceEntry[1];
    const itemName = `${name} ${domain}`;
    return (
      <MenuItem key={externalId} onClick={()=>{
        setChosenPerson(presenceEntry[1]);
        handleClose();
      }}>
        <div className={classes.rightSpace}>
        <Avatar src={`https://www.gravatar.com/avatar/${md5(domain, {encoding: "binary"})}?d=blank`} />
        </div>
        {itemName}
      </MenuItem>
    );
  }
  return (
    <>
      <div className={classes.expansionControlHome}>
        <Button
          className={classes.menuButton}
          endIcon={<ExpandMoreIcon style={{ marginRight: '16px' }} htmlColor={ACTION_BUTTON_COLOR}/>}
          aria-controls="stages-content"
          id="stages-header"
          onClick={handleClick}
        >
          <div className={classes.fontControl}>
            {`${intl.formatMessage({ id: "displaying" })} ${chosenPerson.name} ${chosenPerson.domain}`}
          </div>
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}>
          {peopleChoices}
        </Menu>
      </div>
      {activeWorkspaces.map(market => {
        const marketPresences = getMarketPresences(marketPresencesState, market.id);
        const myPresence = marketPresences && marketPresences.find((presence) => {
          return presence.external_id === chosenPerson.external_id;
        });
        const presence = myPresence || {};
        const comments = getMarketComments(commentsState, market.id);
        const investibles = getMarketInvestibles(investiblesState, market.id);
        const acceptedStage = getAcceptedStage(marketStagesState, market.id) || {};
        const inDialogStage = getInCurrentVotingStage(marketStagesState, market.id) || {};
        const inReviewStage = getInReviewStage(marketStagesState, market.id) || {};
        const inBlockingStage = getBlockedStage(marketStagesState, market.id) || {};
        const requiresInputStage = getRequiredInputStage(marketStagesState, market.id) || {};
        const visibleStages = [
          inDialogStage.id,
          acceptedStage.id,
          inReviewStage.id,
          inBlockingStage.id
        ];
        const myInvestibles = getUserInvestibles(
          presence.id,
          market.id,
          investibles,
          visibleStages,
        );
        const requiresInputInvestibles = getInvestiblesInStage(investibles, requiresInputStage.id) || [];
        const highlightMap = {};
        requiresInputInvestibles.forEach((investible) => {
          if (hasNotVoted(investible, marketPresencesState, comments, market.id, chosenPerson.external_id)) {
            highlightMap[investible.investible.id] = true;
          }
        });
        if (_.isEmpty(myInvestibles) && _.isEmpty(requiresInputInvestibles)) {
          return React.Fragment;
        }
        return (
          <Card key={market.id} elevation={0} className={classes.root}>
            <CardHeader
              className={classes.header}
              id={`m${market.id}`}
              title={<Link color="secondary" id={market.id} key={market.id} href={formMarketLink(market.id)}
                           onClick={(e) => {
                             e.preventDefault();
                             navigate(history, formMarketLink(market.id));}
                           }>{market.name}</Link>}
              titleTypographyProps={{ variant: "subtitle2" }}
            />
            <CardContent className={classes.content}>
              {!_.isEmpty(requiresInputInvestibles) && (
                <SubSection
                  type={SECTION_TYPE_SECONDARY_WARNING}
                  title={intl.formatMessage({ id: 'requiresInputHeader' })}
                  helpTextId="requiresInputSectionHelp"
                >
                  <ArchiveInvestbiles
                    elevation={0}
                    marketId={market.id}
                    presenceMap={getPresenceMap(marketPresencesState, market.id)}
                    investibles={requiresInputInvestibles}
                    highlightMap={highlightMap}
                  />
                  <hr />
                </SubSection>
              )}
              {market.id && !_.isEmpty(myInvestibles) &&
              acceptedStage &&
              inDialogStage &&
              inReviewStage &&
              inBlockingStage && (
                <PlanningIdeas
                  investibles={myInvestibles}
                  marketId={market.id}
                  acceptedStage={acceptedStage}
                  inDialogStageId={inDialogStage.id}
                  inReviewStageId={inReviewStage.id}
                  inBlockingStageId={inBlockingStage.id}
                  activeMarket={market.market_stage === ACTIVE_STAGE}
                  comments={comments}
                  presenceId={presence.id}
                  beingDraggedHack={beingDraggedHack}
                  setBeingDraggedHack={setBeingDraggedHack}
                />
              )}
            </CardContent>
          </Card>
        );
      })}
    </>
  )
}

InvestiblesByWorkspace.propTypes = {
  workspaces: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default InvestiblesByWorkspace;
