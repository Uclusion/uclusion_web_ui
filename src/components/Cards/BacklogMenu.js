import React, { useContext } from 'react';
import { ListSubheader, makeStyles, Menu, MenuItem, Tooltip } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { preventDefaultAndProp } from '../../utils/marketIdPathFunctions';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { updateInvestible } from '../../api/investibles';
import { refreshInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';

const useStyles = makeStyles(() => ({
  paperMenu: {
    border: '0.5px solid grey',
  },
  listSubHeaderRoot: {
    lineHeight: '30px',
  }
}));

function BacklogMenu(props) {
  const { anchorEl, recordPositionToggle, marketId, investibleId, openForInvestment, mouseX, mouseY } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const classes = useStyles();
  const intl = useIntl();

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
            <Tooltip placement='top' title={intl.formatMessage({ id: 'moveToReady' })}>
              <div>
                {intl.formatMessage({ id: 'readyToStartHeader' })}
              </div>
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
            <Tooltip placement='top' title={intl.formatMessage({ id: 'moveToNotReady' })}>
              <div>
                {intl.formatMessage({ id: 'notReadyToStartHeader' })}
              </div>
            </Tooltip>
          </MenuItem>
        )}
      </Menu>
  );
}

export default BacklogMenu;
