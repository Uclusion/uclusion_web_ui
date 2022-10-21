import React from 'react'
import { useIntl } from 'react-intl';
import SubSection from '../../../containers/SubSection/SubSection'
import { SECTION_TYPE_SECONDARY_WARNING } from '../../../constants/global'
import ExpandableAction from '../../../components/SidebarActions/Planning/ExpandableAction'
import AddIcon from '@material-ui/icons/Add'
import ArchiveInvestbiles from '../../DialogArchives/ArchiveInvestibles'
import _ from 'lodash'

function Backlog(props) {
  const {
    group,
    updatePageState,
    furtherWorkReadyToStart,
    furtherWorkInvestibles,
    isAdmin,
    comments,
    presenceMap,
    furtherWorkStage,
    myPresence
  } = props;
  const { market_id: marketId} = group;
  const intl = useIntl();


  function onClickFurtherStart() {
    updatePageState({furtherWorkType: 'readyToStart'});
  }

  function onClickFurther() {
    updatePageState({furtherWorkType: 'notReadyToStart'});
  }

  const furtherWorkReadyToStartChip = furtherWorkReadyToStart.length > 0
    && <span className={'MuiTabItem-tag'} style={{backgroundColor: '#e6e969', borderRadius: 12,
      padding: '2.79px', marginRight: '1rem'}}>
    {furtherWorkReadyToStart.length} total</span>;

  return (
    <>
    <div style={{paddingTop: '1rem'}} />
    <SubSection
      type={SECTION_TYPE_SECONDARY_WARNING}
      bolder
      titleIcon={furtherWorkReadyToStartChip === false ? undefined : furtherWorkReadyToStartChip}
      title={intl.formatMessage({ id: 'readyToStartHeader' })}
      actionButton={
        <ExpandableAction
          icon={<AddIcon htmlColor='#F6BE00'/>}
          label={intl.formatMessage({ id: 'createFurtherWorkExplanation' })}
          openLabel={intl.formatMessage({ id: 'planningDialogAddInvestibleLabel'})}
          onClick={onClickFurtherStart}
          disabled={!isAdmin}
          tipPlacement="top-end"
        />
      }
    >
      <ArchiveInvestbiles
        comments={comments}
        elevation={0}
        marketId={marketId}
        presenceMap={presenceMap}
        investibles={furtherWorkReadyToStart}
        stage={furtherWorkStage}
        presenceId={myPresence.id}
        allowDragDrop
        isReadyToStart
      />
    </SubSection>
    {!_.isEmpty(furtherWorkInvestibles) && (<div style={{ paddingBottom: '15px' }}/>)}

    <SubSection
      type={SECTION_TYPE_SECONDARY_WARNING}
      bolder
      title={intl.formatMessage({ id: 'notReadyToStartHeader' })}
      actionButton={
        <ExpandableAction
          icon={<AddIcon htmlColor="#2F80ED"/>}
          label={intl.formatMessage({ id: 'createFurtherWorkExplanation' })}
          openLabel={intl.formatMessage({ id: 'planningDialogAddInvestibleLabel'})}
          onClick={onClickFurther}
          disabled={!isAdmin}
          tipPlacement="top-end"
        />
      }
    >
      <ArchiveInvestbiles
        comments={comments}
        elevation={0}
        marketId={marketId}
        presenceMap={presenceMap}
        investibles={furtherWorkInvestibles}
        stage={furtherWorkStage}
        presenceId={myPresence.id}
        allowDragDrop
      />
    </SubSection>
    </>
  )
}

export default Backlog;