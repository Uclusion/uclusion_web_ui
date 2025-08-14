import React, { useContext } from 'react';
import { ListItemIcon, ListItemText, makeStyles, Menu, MenuItem, Tooltip } from '@material-ui/core';
import ListAltIcon from '@material-ui/icons/ListAlt';
import { useIntl } from 'react-intl';
import { navigate, preventDefaultAndProp, formInvestibleAddCommentLink } from '../../../utils/marketIdPathFunctions';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { useHistory } from 'react-router';
import { JOB_COMMENT_WIZARD_TYPE } from '../../../constants/markets';
import { ArrowDownward, ArrowUpward } from '@material-ui/icons';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getInCurrentVotingStage, getProposedOptionsStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { TODO_TYPE } from '../../../constants/comments';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { getComment } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { moveInvestibleToCurrentVoting } from '../../../api/investibles';
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';

const useStyles = makeStyles(() => ({
  paperMenu: {
    border: '0.5px solid grey',
    backgroundColor: 'white'
  },
  listSubHeaderRoot: {
    lineHeight: '30px',
  }
}));

function OptionMenu(props) {
  const { anchorEl, recordPositionToggle, marketId, investibleId, openForInvestment, mouseX, mouseY, isAdmin } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [marketsState] = useContext(MarketsContext);
  const [commentsState] = useContext(CommentsContext);
  const classes = useStyles();
  const intl = useIntl();
  const history = useHistory();
  const proposedStage = getProposedOptionsStage(marketStagesState, marketId);
  const underConsiderationStage = getInCurrentVotingStage(marketStagesState, marketId);
  const market = getMarket(marketsState, marketId) || {};
  const { parent_comment_id: parentCommentId, parent_comment_market_id: parentMarketId } = market;
  const comment = getComment(commentsState, parentMarketId, parentCommentId) || {};
  const { investible_id: parentInvestibleId } = comment;

  function createTask() {
    return navigate(history, formInvestibleAddCommentLink(JOB_COMMENT_WIZARD_TYPE, parentInvestibleId, parentMarketId, TODO_TYPE, 
      undefined, investibleId, marketId));
  }

  function changeStage() {
    const fromStage = openForInvestment ? underConsiderationStage : proposedStage;
    const toStage = openForInvestment ? proposedStage : underConsiderationStage;
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: fromStage.id,
        stage_id: toStage.id,
      },
    };
    return moveInvestibleToCurrentVoting(moveInfo)
      .then((inv) => {
        refreshInvestibles(investiblesDispatch, () => {}, [inv]);
        setOperationRunning(false);
      });
  }

  return (
      <Menu
        id="option-menu"
        open
        onClose={recordPositionToggle}
        getContentAnchorEl={null}
        anchorReference="anchorPosition"
        anchorPosition={{ top: mouseY, left: mouseX }}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        anchorEl={anchorEl}
        disableRestoreFocus
        classes={{ paper: classes.paperMenu }}
      >
        {!openForInvestment && isAdmin && (
          <MenuItem key="moveOptionVotingKey" id="moveOptionVotingId" style={{backgroundColor: 'white'}}
                    onClick={(event) => {
                      preventDefaultAndProp(event);
                      return changeStage().then(() => recordPositionToggle());
                    }}
          >
            <ListItemIcon style={{marginLeft: '-0.25rem', minWidth: '26px'}}><ArrowUpward size='small' style={{marginRight: '0.5rem'}} /></ListItemIcon>
            <Tooltip placement='top' title={intl.formatMessage({ id: 'promoteOptionExplanation' })}>
              <ListItemText>
                {intl.formatMessage({ id: 'promoteOption' })}
              </ListItemText>
            </Tooltip>
          </MenuItem>
        )}
        {openForInvestment && isAdmin && (
          <MenuItem key="moveOptionNotVotingKey" id="moveOptionNotVotingId" style={{backgroundColor: 'white'}}
                    onClick={(event) => {
                      preventDefaultAndProp(event);
                      return changeStage().then(() => recordPositionToggle());
                    }}
          >
            <ListItemIcon style={{marginLeft: '-0.25rem', minWidth: '26px'}}><ArrowDownward size='small' style={{marginRight: '0.5rem'}} /></ListItemIcon>
            <Tooltip placement='top' title={intl.formatMessage({ id: 'demoteOptionExplanation' })}>
              <ListItemText>
                {intl.formatMessage({ id: 'demoteOption' })}
              </ListItemText>
            </Tooltip>
          </MenuItem>
        )}
        {parentInvestibleId && (
          <MenuItem key="makeTaskKey" id="makeTaskId"
            onClick={(event) => {
              preventDefaultAndProp(event);
              return createTask();
            }}
          >
            <ListItemIcon style={{marginLeft: '-0.25rem', minWidth: '26px'}}><ListAltIcon size='small' style={{marginRight: '0.5rem'}} /></ListItemIcon>
            <Tooltip placement='top' title={intl.formatMessage({ id: 'makeTaskExplanation' })}>
              <ListItemText>
                {intl.formatMessage({ id: 'makeTask' })}
              </ListItemText>
            </Tooltip>
          </MenuItem>
        )}
      </Menu>
  );
}

export default OptionMenu;
