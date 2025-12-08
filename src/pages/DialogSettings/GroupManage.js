import React, { useContext, useState } from 'react';
import Screen from '../../containers/Screen/Screen';
import { useLocation } from 'react-router';
import queryString from 'query-string';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext';
import { getGroup } from '../../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { decomposeMarketPath } from '../../utils/marketIdPathFunctions';
import Grid from '@material-ui/core/Grid';
import clsx from 'clsx';
import { CardContent, makeStyles, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import ManageExistingUsers from '../Dialog/UserManagement/ManageExistingUsers';
import { useIntl } from 'react-intl';
import { usePlanFormStyles } from '../../components/AgilePlan';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import { ACTIVE_STAGE } from '../../constants/markets';
import CardActions from '@material-ui/core/CardActions';
import SpinningIconLabelButton from '../../components/Buttons/SpinningIconLabelButton';
import { SettingsBackupRestore } from '@material-ui/icons';
import _ from 'lodash';
import AddNewUsers from '../Dialog/UserManagement/AddNewUsers';
import { changeGroupParticipation } from '../../api/markets';
import { addGroupMembers } from '../../contexts/GroupMembersContext/groupMembersContextReducer';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { GroupMembersContext } from '../../contexts/GroupMembersContext/GroupMembersContext';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { is } from 'immutable';

const useStyles = makeStyles((theme) => {
  return {
    container: {
      marginLeft: '5rem',
      marginTop: '3rem',
      [theme.breakpoints.down('sm')]: {
        marginLeft: '0.5rem',
      },
    },
  };
});

function GroupManage() {
  const location = useLocation();
  const { pathname, search: querySearch } = location;
  const { marketId } = decomposeMarketPath(pathname);
  const values = queryString.parse(querySearch);
  const { groupId } = values || {};
  const [groupState] = useContext(MarketGroupsContext);
  const [checked, setChecked] = useState([]);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [, groupPresencesDispatch] = useContext(GroupMembersContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const group = getGroup(groupState, marketId, groupId) || {};
  const isAddGroup = !_.isEmpty(group);
  const { id, name } = group;
  const intl = useIntl();
  const classes = usePlanFormStyles();
  const myClasses = useStyles();
  const [marketsState] = useContext(MarketsContext);
  const renderableMarket = getMarket(marketsState, marketId) || {};
  const { market_stage: marketStage } = renderableMarket;
  const active = marketStage === ACTIVE_STAGE;
  const isEveryoneView = group?.group_type === 'EVERYONE';

  function handleSaveParticipants() {
    const added = checked.map((added) => {
      const found = marketPresences.find((presence) => presence.external_id === added.external_id);
      return {user_id: found.id, is_following: true};
    });
    return changeGroupParticipation(marketId, group.id, added).then((newUsers) => {
      setOperationRunning(false);
      setChecked([]);
      groupPresencesDispatch(addGroupMembers(marketId, group.id, newUsers));
    });
  }

  if (!id || !active) {
    return React.Fragment;
  }

  return (
    <Screen
      title={`${name} Members`}
      tabTitle={`${name} Members`}
    >
      <div className={myClasses.container}>
        <Grid container className={clsx(classes.fieldset, classes.flex, classes.justifySpace)}>
          <Grid item md={5} xs={12} className={classes.fieldsetContainer} id='viewMembersList'>
            <Typography variant="h6">
              {intl.formatMessage({ id: 'viewMembers' })}
            </Typography>
            <ManageExistingUsers group={group}/>
          </Grid>
          <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
            {isAddGroup && !isEveryoneView && (
              <CardActions style={{paddingTop: '2rem', paddingLeft: '1rem'}}>
                <SpinningIconLabelButton onClick={handleSaveParticipants} icon={SettingsBackupRestore}
                                         id="participantAddButton"
                                         disabled={_.isEmpty(checked)}>
                  {intl.formatMessage({ id: mobileLayout ? 'addExistingCollaboratorMobile' :
                      'addExistingCollaborator' })}
                </SpinningIconLabelButton>
              </CardActions>
            )}
            {!isEveryoneView && (
              <CardContent>
                <AddNewUsers market={renderableMarket} name={name} group={group} isAddToGroup={isAddGroup} showAll={false}
                            setToAddClean={(value) => setChecked(value)} />
              </CardContent>
            )}
          </Grid>
        </Grid>
      </div>
    </Screen>
  );
}

export default GroupManage;