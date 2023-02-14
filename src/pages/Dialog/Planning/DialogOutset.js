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

export const DIALOG_OUTSET_STATE_HACK = {};

function DialogOutset(props) {
  const { marketPresences, marketId, groupId } = props;
  const history = useHistory();
  const intl = useIntl();
  const [groupPresencesState] = useContext(GroupMembersContext);
  const groupCollaborators = getGroupPresences(marketPresences, groupPresencesState, marketId, groupId)
  const classes = usePlanningInvestibleStyles();
  // TODO handle popopen on search with number next to menu item (or however did for groups)
  /*
    const archiveInvestibles = investibles.filter((inv) => {
    const marketInfo = getMarketInfo(inv, marketId) || {};
    const stage = marketStages.find((stage) => stage.id === marketInfo.stage);
    return stage && stage.close_comments_on_entrance;
  });
    const resolvedMarketComments = comments.filter((comment) => {
    if (_.isEmpty(search)) {
      return !comment.investible_id && comment.resolved;
    }
    return !comment.investible_id && comment.resolved && (results.find((item) => item.id === comment.id)
      || parentResults.find((id) => id === comment.id));
  });
  const archivedSize = _.size(archiveInvestibles) + _.size(resolvedMarketComments);
   */
  return (
    <div id="dialogOutset" style={{
      paddingTop: '4rem',
      height: '100vh',
      marginRight: '1rem',
      overflowY: 'none',
      boxShadow: "2px 2px 2px grey",
      display: 'none'
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
           if (dialogOutset) {
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
            >
              {intl.formatMessage({id: 'planningDialogViewArchivesLabel'})}
            </MenuItem>
          </Menu>
          <div className={clsx(classes.group, classes.assignments)} style={{paddingBottom: '1rem'}}>
            <div className={classes.assignmentContainer}>
              <b><FormattedMessage id="collaborators"/></b>
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