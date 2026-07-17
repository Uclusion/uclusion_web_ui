import React, { useContext } from 'react';
import clsx from 'clsx';
import { FormattedMessage, useIntl } from 'react-intl';
import { Assignments, usePlanningInvestibleStyles } from '../../Investible/Planning/PlanningInvestible';
import { getGroupPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import SettingsIcon from '@material-ui/icons/Settings';
import { Menu, MenuItem, Sidebar as ProSidebar } from 'react-pro-sidebar';
import {
  formGroupEditLink,
  formGroupManageLink,
  navigate
} from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import _ from 'lodash';
import AddIcon from '@material-ui/icons/Add';
import { Tooltip } from '@material-ui/core';
import { changeGroupParticipation } from '../../../api/markets';
import { modifyGroupMembers } from '../../../contexts/GroupMembersContext/groupMembersContextReducer';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import { ThemeModeContext } from '../../../contexts/ThemeModeContext';
import {
  DARK_ACTION_BUTTON_COLOR,
  DARK_CARD_BORDER_COLOR,
  DARK_SIDEBAR_COLOR
} from '../../../components/Buttons/ButtonConstants';

export const DIALOG_OUTSET_STATE_HACK = {};

function DialogOutset(props) {
  const { marketPresences, marketId, groupId } = props;
  const history = useHistory();
  const intl = useIntl();
  const [groupPresencesState, groupPresencesDispatch] = useContext(GroupMembersContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [themeMode] = useContext(ThemeModeContext);
  const isDark = themeMode === 'dark';
  const iconColor = isDark ? DARK_ACTION_BUTTON_COLOR : 'black';
  const groupCollaborators = getGroupPresences(marketPresences, groupPresencesState, marketId, groupId)
  const classes = usePlanningInvestibleStyles();
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  const isCurrentUserMember = !_.isEmpty(groupCollaborators.find((presence) =>
    presence.id === myPresence.id));

  function closeOutset() {
    const dialogOutset = document.getElementById(`dialogOutset`);
    if (dialogOutset) {
      DIALOG_OUTSET_STATE_HACK.open = 0;
      dialogOutset.style.display = 'none';
    }
  }

  function myNavigate(url) {
    closeOutset();
    navigate(history, url, false, true);
  }

  return (
    <>
      <div id="dialogOutset" style={{
        marginLeft: '1.65rem',
        overflowY: 'none',
        zIndex: 3,
        position: 'absolute',
        boxShadow: isDark ? '2px 2px 2px black' : '2px 2px 2px lightgrey',
        border: isDark ? `1px solid ${DARK_CARD_BORDER_COLOR}` : undefined,
        backgroundColor: isDark ? DARK_SIDEBAR_COLOR : 'white',
        display: 'none'
      }}
           onMouseEnter={() => {
             const dialogOutset = document.getElementById(`dialogOutset`);
             if (dialogOutset) {
               DIALOG_OUTSET_STATE_HACK.open = 1;
               dialogOutset.style.display = 'block';
             }
           }}
           onMouseLeave={closeOutset}
      >
        <ProSidebar width="10rem" backgroundColor={isDark ? DARK_SIDEBAR_COLOR : 'white'}>
          <div style={{paddingTop: '1rem'}} />
            <Menu rootStyles={{'.ps-menu-button': {paddingLeft: 0, height: 'unset'}}}>
              <MenuItem icon={<SettingsIcon htmlColor={iconColor} style={{fontSize: '1rem', marginBottom: '0.15rem'}} />}
                        key={`groupSettings${groupId}`}
                        rootStyles={{
                          '.css-wx7wi4': {
                            marginRight: 0
                          },
                        }}
                        onClick={() => myNavigate(formGroupEditLink(marketId, groupId))}
              >
                {intl.formatMessage({id: 'settings'})}
              </MenuItem>
            </Menu>
            <div className={clsx(classes.group, classes.assignments)} 
                  style={{paddingBottom: '1rem', paddingTop: '1rem', paddingLeft: '0.5rem'}}>
              <div className={classes.assignmentContainer}>
                <b><FormattedMessage id="viewMembers"/></b>
                {!isCurrentUserMember && (
                  <div>
                    <Menu rootStyles={{'.ps-menu-button': {paddingLeft: 0, height: 'unset'}}}>
                      <MenuItem icon={<AddIcon htmlColor={iconColor} style={{fontSize: '1rem', marginBottom: '0.15rem'}} />}
                                key="addMeKey" id="addMeId"
                                rootStyles={{
                                  '.css-wx7wi4': {
                                    marginRight: 0,
                                  },
                                }}
                                onClick={() => {
                                  setOperationRunning(true);
                                  closeOutset();
                                  const addressed = [{user_id: myPresence.id, is_following: true}];
                                  return changeGroupParticipation(marketId, groupId, addressed).then((modifed) => {
                                    groupPresencesDispatch(modifyGroupMembers(groupId, modifed));
                                    setTimeout(() => {
                                      // Give the dispatch time to work
                                      setOperationRunning(false);
                                    }, 4000);
                                  });
                                }}
                      >
                        <Tooltip title={intl.formatMessage({ id: 'addMeExplanation' })}>
                          <div>
                            {intl.formatMessage({ id: 'addMe' })}
                          </div>
                        </Tooltip>
                      </MenuItem>
                    </Menu>
                  </div>
                )}
                <div>
                  <Menu rootStyles={{'.ps-menu-button': {paddingLeft: 0, height: 'unset'}}}>
                    <MenuItem icon={<PersonAddIcon htmlColor={iconColor} style={{fontSize: '1rem', marginBottom: '0.15rem'}} />}
                              key="manageMembersKey" id="manageMembersId"
                              rootStyles={{
                                '.css-wx7wi4': {
                                  marginRight: 0,
                                },
                              }}
                              onClick={() => myNavigate(formGroupManageLink(marketId, groupId))}
                    >
                      <Tooltip title={intl.formatMessage({ id: 'manageMembersExplanation' })}>
                        <div>
                          {intl.formatMessage({ id: 'manageMembers' })}
                        </div>
                      </Tooltip>
                    </MenuItem>
                  </Menu>
                </div>
                <Assignments
                  classes={classes}
                  marketPresences={marketPresences}
                  assigned={groupCollaborators.map((presence) => presence.id)}
                  toolTipId="collaborators"
                />
              </div>
            </div>
        </ProSidebar>
      </div>
    </>
  );
}

export default DialogOutset;