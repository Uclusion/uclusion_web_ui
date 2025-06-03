import React, { useContext } from 'react';
import { ListItemIcon, ListItemText, ListSubheader, makeStyles, Menu, MenuItem, Tooltip } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { formWizardLink, navigate, preventDefaultAndProp } from '../../utils/marketIdPathFunctions';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { stageChangeInvestible, updateInvestible } from '../../api/investibles';
import { refreshInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import _ from 'lodash';
import { JOB_STAGE_WIZARD_TYPE } from '../../constants/markets';
import { useHistory } from 'react-router';
import Chip from '@material-ui/core/Chip';
import { AssignmentInd } from '@material-ui/icons';

const useStyles = makeStyles(() => ({
  paperMenu: {
    border: '0.5px solid grey',
  },
  listSubHeaderRoot: {
    lineHeight: '30px',
  },
  chipStyleYellow: {
    padding: '4px',
    backgroundColor: '#e6e969',
    marginRight: '0.5rem'
  },
  chipStyleBlue: {
    padding: '4px',
    backgroundColor: '#2F80ED',
    marginRight: '0.5rem'
  }
}));

function BacklogMenu(props) {
  const { anchorEl, recordPositionToggle, marketId, investibleId, openForInvestment, mouseX, mouseY,
    myGroupPresence, isAutonomous, acceptedStageId, stage, inDialogStageId } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const classes = useStyles();
  const intl = useIntl();
  const history = useHistory();

  function toggleOpenForInvestment() {
    const updateInfo = {
      marketId,
      investibleId,
      openForInvestment: !openForInvestment,
    };
    setOperationRunning('readyToStart');
    return updateInvestible(updateInfo).then((fullInvestible) => {
      refreshInvestibles(investiblesDispatch, () => {}, [fullInvestible]);
      setOperationRunning(false);
    });
  }

  function assignJob() {
    if (isAutonomous) {
      const moveInfo = {
        marketId,
        investibleId,
        stageInfo: {
          current_stage_id: stage,
          stage_id: !_.isEmpty(myGroupPresence) ? acceptedStageId : inDialogStageId,
          assignments: [myGroupPresence.id]
        },
      };
      setOperationRunning(true);
      return stageChangeInvestible(moveInfo)
        .then((newInv) => {
          refreshInvestibles(investiblesDispatch, () => {}, [newInv]);
          setOperationRunning(false);
        });
    } else {
      navigate(history, `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, investibleId)}&isAssign=true`);
    }
  }

  return (
      <Menu
        id="bug-menu"
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
        <ListSubheader classes={{root:classes.listSubHeaderRoot}}>Move to</ListSubheader>
        {!openForInvestment && (
          <MenuItem key="moveJobYellowKey" id="moveJobYellowId"
                    onClick={(event) => {
                      preventDefaultAndProp(event);
                      return toggleOpenForInvestment().then(() => recordPositionToggle());
                    }}
          >
            <ListItemIcon style={{marginLeft: '-0.25rem', minWidth: '26px'}}><Chip color="primary" size='small' className={classes.chipStyleYellow} /></ListItemIcon>
            <Tooltip placement='top' title={intl.formatMessage({ id: 'moveToReady' })}>
              <ListItemText>
                {intl.formatMessage({ id: 'readyToStartHeader' })}
              </ListItemText>
            </Tooltip>
          </MenuItem>
        )}
        {openForInvestment && (
          <MenuItem key="moveJobBlueKey" id="moveJobBlueId"
                    onClick={(event) => {
                      preventDefaultAndProp(event);
                      return toggleOpenForInvestment().then(() => recordPositionToggle());
                    }}
          >
            <ListItemIcon style={{marginLeft: '-0.25rem', minWidth: '26px'}}><Chip color="primary" size='small' className={classes.chipStyleBlue} /></ListItemIcon>
            <Tooltip placement='top' title={intl.formatMessage({ id: 'moveToNotReady' })}>
              <ListItemText>
                {intl.formatMessage({ id: 'notReadyToStartHeader' })}
              </ListItemText>
            </Tooltip>
          </MenuItem>
        )}
        <MenuItem key="assignJobKey" id="assignJobId"
                  onClick={(event) => {
                    preventDefaultAndProp(event);
                    return assignJob().then(() => recordPositionToggle());
                  }}
        >
          <ListItemIcon style={{marginLeft: '-0.25rem', minWidth: '26px'}}><AssignmentInd size='small' style={{marginRight: '0.5rem'}} /></ListItemIcon>
          <Tooltip placement='top' title={intl.formatMessage({ id: 'moveAssigned' })}>
            <ListItemText>
              {intl.formatMessage({ id: 'planningInvestibleAssignments' })}
            </ListItemText>
          </Tooltip>
        </MenuItem>
      </Menu>
  );
}

export default BacklogMenu;
