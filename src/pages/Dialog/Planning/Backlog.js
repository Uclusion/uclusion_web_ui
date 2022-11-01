import React from 'react'
import { useIntl } from 'react-intl';
import SubSection from '../../../containers/SubSection/SubSection'
import { SECTION_TYPE_SECONDARY_WARNING } from '../../../constants/global'
import AddIcon from '@material-ui/icons/Add'
import ArchiveInvestbiles from '../../DialogArchives/ArchiveInvestibles'
import _ from 'lodash'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton';
import { navigate } from '../../../utils/marketIdPathFunctions';
import { JOB_WIZARD_TYPE } from '../../../constants/markets';
import { useHistory } from 'react-router';

function Backlog(props) {
  const {
    group,
    furtherWorkReadyToStart,
    furtherWorkInvestibles,
    comments,
    presenceMap,
    furtherWorkStage,
    myPresence
  } = props;
  const { market_id: marketId, id: groupId} = group;
  const intl = useIntl();
  const history = useHistory();

  const furtherWorkReadyToStartChip = furtherWorkReadyToStart.length > 0
    && <span className={'MuiTabItem-tag'} style={{backgroundColor: '#e6e969', borderRadius: 12,
      padding: '2.79px', marginRight: '1rem'}}>
    {furtherWorkReadyToStart.length} total</span>;

  return (
    <>
    <div style={{paddingTop: '1rem'}} />
      <SpinningIconLabelButton onClick={() => navigate(history, `/wizard#type=${JOB_WIZARD_TYPE}&marketId=${marketId}&groupId=${groupId}`)} doSpin={false} icon={AddIcon} id='addJob'>
        {intl.formatMessage({ id: 'addStoryLabel' })}
      </SpinningIconLabelButton>
    <SubSection
      type={SECTION_TYPE_SECONDARY_WARNING}
      bolder
      titleIcon={furtherWorkReadyToStartChip === false ? undefined : furtherWorkReadyToStartChip}
      title={intl.formatMessage({ id: 'readyToStartHeader' })}
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