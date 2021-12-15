import { Grid } from '@material-ui/core'
import DecisionInvestibleAdd from './DecisionInvestibleAdd'
import { addInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import SubSection from '../../../containers/SubSection/SubSection'
import { SECTION_TYPE_SECONDARY } from '../../../constants/global'
import ExpandableAction from '../../../components/SidebarActions/Planning/ExpandableAction'
import AddIcon from '@material-ui/icons/Add'
import CurrentVoting from './CurrentVoting'
import ProposedIdeas from './ProposedIdeas'
import React, { useContext } from 'react'
import { getPageReducerPage, usePageStateReducer } from '../../../components/PageState/pageStateHooks'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { useIntl } from 'react-intl'

function DecisionVoting(props) {
  const { comments, marketId, isAdmin, proposed, marketPresences, inArchives, underConsideration } = props;
  const intl = useIntl();
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const investibleComments = comments.filter((comment) => comment.investible_id);
  const [investibleAddStateFull, investibleAddDispatch] = usePageStateReducer('investibleAdd');
  const [investibleAddState, updateInvestibleAddState, investibleAddStateReset] =
    getPageReducerPage(investibleAddStateFull, investibleAddDispatch, marketId);
  const {
    investibleAddBeingEdited,
  } = investibleAddState;

  function toggleInvestibleAdd() {
    updateInvestibleAddState({investibleAddBeingEdited: !investibleAddBeingEdited});
  }

  return (
    <>
      <Grid item xs={12} style={{ marginTop: '2rem' }}>
        {investibleAddBeingEdited && (
          <div style={{ marginBottom: '2rem' }}>
            <DecisionInvestibleAdd
              marketId={marketId}
              onSave={(investible) => addInvestible(investiblesDispatch, () => {}, investible)}
              onCancel={toggleInvestibleAdd}
              onSpinComplete={toggleInvestibleAdd}
              isAdmin={isAdmin}
              pageState={investibleAddState}
              pageStateUpdate={updateInvestibleAddState}
              pageStateReset={investibleAddStateReset}
            />
          </div>
        )}
        <SubSection
          id="currentVoting"
          type={SECTION_TYPE_SECONDARY}
          title={intl.formatMessage({ id: 'decisionDialogCurrentVotingLabel' })}
          actionButton={inArchives ? null :
            (<ExpandableAction
              icon={<AddIcon htmlColor="black"/>}
              label={intl.formatMessage({ id: 'decisionDialogAddExplanationLabel' })}
              openLabel={intl.formatMessage({ id: 'decisionDialogAddInvestibleLabel' })}
              onClick={toggleInvestibleAdd}
              disabled={!isAdmin}
              tipPlacement="top-end"
            />)}
        >
          <CurrentVoting
            marketPresences={marketPresences}
            investibles={underConsideration}
            marketId={marketId}
            comments={investibleComments}
            inArchives={inArchives}
            isAdmin={isAdmin}
          />
        </SubSection>
      </Grid>
      <Grid item xs={12} style={{ marginTop: '1.5rem' }}>
        <SubSection
          id="proposed"
          type={SECTION_TYPE_SECONDARY}
          title={intl.formatMessage({ id: 'decisionDialogProposedOptionsLabel' })}
          actionButton={inArchives ? null :
            (<ExpandableAction
              icon={<AddIcon htmlColor="black"/>}
              label={intl.formatMessage({ id: 'decisionDialogProposeExplanationLabel' })}
              openLabel={intl.formatMessage({ id: 'decisionDialogProposeInvestibleLabel' })}
              onClick={toggleInvestibleAdd}
              disabled={isAdmin}
              tipPlacement="top-end"
            />)}
        >
          <ProposedIdeas
            investibles={proposed}
            marketId={marketId}
            isAdmin={isAdmin}
          />
        </SubSection>
      </Grid>
    </>
  );
}

export default DecisionVoting;