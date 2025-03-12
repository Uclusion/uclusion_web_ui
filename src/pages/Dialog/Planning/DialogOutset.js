import React, { useContext } from 'react';
import clsx from 'clsx';
import { FormattedMessage, useIntl } from 'react-intl';
import { Assignments, usePlanningInvestibleStyles } from '../../Investible/Planning/PlanningInvestible';
import { getGroupPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import SettingsIcon from '@material-ui/icons/Settings';
import { Menu, MenuItem, ProSidebar, SidebarContent } from 'react-pro-sidebar';
import { formGroupArchiveLink, formGroupEditLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import MenuBookIcon from '@material-ui/icons/MenuBook';
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext';
import _ from 'lodash';
import AddIcon from '@material-ui/icons/Add';
import { Tooltip } from '@material-ui/core';
import { changeGroupParticipation } from '../../../api/markets';
import { modifyGroupMembers } from '../../../contexts/GroupMembersContext/groupMembersContextReducer';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';

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
  return (
    <div id="dialogOutset" style={{
      marginRight: '1rem',
      overflowY: 'none',
      zIndex: 3,
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
         onMouseLeave={() => {
           const dialogOutset = document.getElementById(`dialogOutset`);
           if (dialogOutset && !isArchivedSearch) {
             DIALOG_OUTSET_STATE_HACK.open = 0;
             dialogOutset.style.display = 'none';
           }
         }}
    >
      <ProSidebar width="12rem">
        <SidebarContent>
          <Menu iconShape="circle">
            <MenuItem icon={<SettingsIcon htmlColor="black"/>} key={`groupSettings${groupId}`}
                      onClick={
                        () => navigate(history, formGroupEditLink(marketId, groupId),
                          false, true)
                      }
            >
              {intl.formatMessage({id: 'settings'})}
            </MenuItem>
            <MenuItem icon={<MenuBookIcon htmlColor="black"/>} key={`groupArchive${groupId}`}
                      onClick={
                        () => navigate(history, formGroupArchiveLink(marketId, groupId),
                          false, true)
                      }
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
  );
}

export default DialogOutset;