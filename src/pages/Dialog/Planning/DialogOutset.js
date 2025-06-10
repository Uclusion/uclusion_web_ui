import React, { useContext } from 'react';
import clsx from 'clsx';
import { FormattedMessage, useIntl } from 'react-intl';
import { Assignments, usePlanningInvestibleStyles } from '../../Investible/Planning/PlanningInvestible';
import { getGroupPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import SettingsIcon from '@material-ui/icons/Settings';
import { Menu, MenuItem, ProSidebar, SidebarContent } from 'react-pro-sidebar';
import {
  formGroupArchiveLink,
  formGroupEditLink,
  formGroupManageLink,
  navigate
} from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import MenuBookIcon from '@material-ui/icons/MenuBook';
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext';
import _ from 'lodash';
import AddIcon from '@material-ui/icons/Add';
import { Tooltip } from '@material-ui/core';
import { changeGroupParticipation } from '../../../api/markets';
import { modifyGroupMembers } from '../../../contexts/GroupMembersContext/groupMembersContextReducer';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import PersonAddIcon from '@material-ui/icons/PersonAdd';

export const DIALOG_OUTSET_STATE_HACK = {};

function DialogOutset(props) {
  const { marketPresences, marketId, groupId, hidden, archivedSize } = props;
  const history = useHistory();
  const intl = useIntl();
  const [groupPresencesState, groupPresencesDispatch] = useContext(GroupMembersContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [searchResults] = useContext(SearchResultsContext);
  const { search } = searchResults;
  const groupCollaborators = getGroupPresences(marketPresences, groupPresencesState, marketId, groupId)
  const classes = usePlanningInvestibleStyles();
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  const isCurrentUserMember = !_.isEmpty(groupCollaborators.find((presence) =>
    presence.id === myPresence.id));
  const isArchivedSearch = !hidden && !_.isEmpty(search) && archivedSize > 0;

  function closeOutset() {
    const dialogOutset = document.getElementById(`dialogOutset`);
    if (dialogOutset && !isArchivedSearch) {
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
      <div id="dialogOutsetBuffer" style={{width: '16rem', display: isArchivedSearch ? 'block' : 'none'}} />
      <div id="dialogOutset" style={{
        marginLeft: '1.65rem',
        paddingLeft: '0.5rem',
        backgroundColor: 'white',
        overflowY: 'none',
        zIndex: 3,
        position: 'absolute',
        boxShadow: "2px 2px 2px lightgrey",
        display: isArchivedSearch ? 'block' : 'none'
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
        <ProSidebar width="10rem">
          <SidebarContent>
            <Menu iconShape="circle">
              <MenuItem icon={<SettingsIcon htmlColor="black"/>} key={`groupSettings${groupId}`}
                        onClick={() => myNavigate(formGroupEditLink(marketId, groupId))}
              >
                {intl.formatMessage({id: 'settings'})}
              </MenuItem>
              <MenuItem icon={<MenuBookIcon htmlColor="black"/>} key={`groupArchive${groupId}`}
                        onClick={() => myNavigate(formGroupArchiveLink(marketId, groupId))}
                        suffix={isArchivedSearch ?
                          <span style={{backgroundColor: '#055099', borderRadius: 22, paddingLeft: '5px',
                                  paddingRight: '5px', color: 'white',
                                  padding: '1px 4px', fontSize: '0.75rem', lineHeight: '16px',
                                  marginLeft: '8px', whiteSpace: 'nowrap'}}>
                            {archivedSize} {intl.formatMessage({ id: 'total' })}
                          </span> : undefined}
              >
                {intl.formatMessage({id: 'planningDialogViewArchivesLabel'})}
              </MenuItem>
            </Menu>
            <div className={clsx(classes.group, classes.assignments)} style={{paddingBottom: '1rem'}}>
              <div className={classes.assignmentContainer}>
                <b><FormattedMessage id="viewMembers"/></b>
                {!isCurrentUserMember && (
                  <div style={{marginLeft: '-1rem'}}>
                    <Menu iconShape="circle">
                      <MenuItem icon={<AddIcon htmlColor="black" />}
                                key="addMeKey" id="addMeId"
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
                <div style={{marginLeft: '-1rem'}}>
                  <Menu iconShape="circle">
                    <MenuItem icon={<PersonAddIcon htmlColor="black" />}
                              key="manageMembersKey" id="manageMembersId"
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
          </SidebarContent>
        </ProSidebar>
      </div>
    </>
  );
}

export default DialogOutset;