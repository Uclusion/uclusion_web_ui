import React, { useContext } from 'react'
import { useIntl } from 'react-intl';
import PlanningInvestibleAdd from './PlanningInvestibleAdd'
import SubSection from '../../../containers/SubSection/SubSection'
import { SECTION_TYPE_SECONDARY_WARNING, SECTION_TYPE_WARNING } from '../../../constants/global'
import ExpandableAction from '../../../components/SidebarActions/Planning/ExpandableAction'
import AddIcon from '@material-ui/icons/Add'
import ArchiveInvestbiles from '../../DialogArchives/ArchiveInvestibles'
import _ from 'lodash'
import { usePlanFormStyles } from '../../../components/AgilePlan'
import Chip from '@material-ui/core/Chip'
import { useInvestiblesByPersonStyles } from './InvestiblesByPerson'
import { navigate } from '../../../utils/marketIdPathFunctions'
import { addInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { useHistory } from 'react-router'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'

function Backlog(props) {
  const {
    furtherWorkType,
    group,
    updatePageState,
    marketPresences,
    furtherWorkReadyToStart,
    furtherWorkInvestibles,
    isAdmin,
    comments,
    presenceMap,
    furtherWorkStage,
    myPresence
  } = props;
  const history = useHistory();
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const { id: groupId, created_at: createdAt, budget_unit: budgetUnit, use_budget: useBudget,
    votes_required: votesRequired, market_id: marketId} = group;
  const intl = useIntl();
  const classes = useInvestiblesByPersonStyles();
  const planningInvestibleAddClasses = usePlanFormStyles();

  function onDone(destinationLink) {
    if (destinationLink) {
      navigate(history, destinationLink);
    }
  }

  function onInvestibleSave(investible) {
    addInvestible(investiblesDispatch, diffDispatch, investible);
  }

  function onClickFurtherStart() {
    updatePageState({furtherWorkType: 'readyToStart'});
  }

  function onClickFurther() {
    updatePageState({furtherWorkType: 'notReadyToStart'});
  }

  const furtherWorkReadyToStartChip = furtherWorkReadyToStart.length > 0
    && <Chip label={`${furtherWorkReadyToStart.length}`} color="primary" size='small'
             className={classes.chipStyleYellow} />;
  const furtherWorkNotReadyToStartChip = furtherWorkInvestibles.length > 0 &&
    <Chip label={`${furtherWorkInvestibles.length}`} size='small' className={classes.chipStyleBlue} />;

  return (
    <>
      {furtherWorkType === 'readyToStart' && (
        <PlanningInvestibleAdd
          marketId={marketId}
          groupId={groupId}
          onCancel={() => updatePageState({furtherWorkType: undefined})}
          onSave={onInvestibleSave}
          onSpinComplete={(destinationLink) => {
            updatePageState({furtherWorkType: undefined});
            onDone(destinationLink);
          }}
          marketPresences={marketPresences}
          createdAt={createdAt}
          classes={planningInvestibleAddClasses}
          maxBudgetUnit={budgetUnit}
          useBudget={useBudget ? useBudget : false}
          votesRequired={votesRequired}
          furtherWorkType={furtherWorkType}
        />
      )}
    <div style={{paddingTop: '1rem'}} />
    <SubSection
      type={SECTION_TYPE_SECONDARY_WARNING}
      titleIcon={furtherWorkReadyToStartChip === false ? undefined : furtherWorkReadyToStartChip}
      title={intl.formatMessage({ id: 'readyToStartHeader' })}
      actionButton={
        <ExpandableAction
          icon={<AddIcon htmlColor="black"/>}
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
    {furtherWorkType === 'notReadyToStart' && (
      <PlanningInvestibleAdd
        marketId={marketId}
        groupId={groupId}
        onCancel={() => updatePageState({furtherWorkType: undefined})}
        onSave={onInvestibleSave}
        onSpinComplete={(destinationLink) => {
          updatePageState({furtherWorkType: undefined});
          onDone(destinationLink);
        }}
        marketPresences={marketPresences}
        createdAt={createdAt}
        classes={planningInvestibleAddClasses}
        maxBudgetUnit={budgetUnit}
        useBudget={useBudget ? useBudget : false}
        votesRequired={votesRequired}
        furtherWorkType={furtherWorkType}
      />
    )}
    <SubSection
      type={SECTION_TYPE_WARNING}
      titleIcon={furtherWorkNotReadyToStartChip === false ? undefined : furtherWorkNotReadyToStartChip}
      title={intl.formatMessage({ id: 'notReadyToStartHeader' })}
      actionButton={
        <ExpandableAction
          icon={<AddIcon htmlColor="black"/>}
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