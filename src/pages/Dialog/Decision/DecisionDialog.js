/**
 * A component that renders a _decision_ dialog
 */
import React from 'react';
import PropTypes from 'prop-types';
import Summary from '../Summary';
import { Grid } from '@material-ui/core';
import InvestibleAdd from './InvestibleAdd';
import ProposedIdeas from './ProposedIdeas';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import SubSection from '../../../containers/SubSection/SubSection';
import Voting from './Voting';

function DecisionDialog(props) {

  const {
    market,
    investibles,
    comments,
    commentsHash,
    marketStages,
    marketPresences,
    myPresence,
    addInvestibleMode,
    setAddInvestibleMode
  } = props;
  const { is_admin: isAdmin } = myPresence;
  const underConsiderationStage = marketStages.find((stage) => stage.allows_investment);
  const proposedStage = marketStages.find((stage) => !stage.allows_investment && !stage.appears_in_market_summary);

  const marketComments = comments.filter((comment) => !comment.investible_id);
  const investibleComments = comments.filter((comment) => comment.investible_id);
  function getInvestiblesForStage(stage) {
    if (stage) {
      return investibles.reduce((acc, inv) => {
        const { market_infos } = inv;
        for (let x = 0; x < market_infos.length; x += 1) {
          if (market_infos[x].stage === stage.id) {
            return [...acc, inv];
          }
        }
        return acc;
      }, []);
    }
    return [];
  }

  const underConsideration = getInvestiblesForStage(underConsiderationStage);
  const proposed = getInvestiblesForStage(proposedStage);

  const { id: marketId } = market;
  function toggleAddMode() {
    setAddInvestibleMode(!addInvestibleMode);
  }
  // if we're adding an investible, just render it
  if (addInvestibleMode) {
    return (
      <InvestibleAdd
        marketId={marketId}
        onCancel={toggleAddMode}
        onSave={toggleAddMode}
        isAdmin={isAdmin}
      />
    );
  }


  return (
    <Grid
      container
      spacing={2}
    >
      <Grid
        item
        xs={12}
      >
        <SubSection
          title="Current Voting"
        >
          <Voting
            marketPresences={marketPresences}
            investibles={underConsideration}
            marketId={marketId}
          />
        </SubSection>
      </Grid>

      <Grid
        item
        xs={12}
      >
        <SubSection
          title="Proposed Options"
        >
          <ProposedIdeas investibles={proposed} marketId={marketId} comments={investibleComments}/>
        </SubSection>
      </Grid>
      <Grid
        item
        xs={12}
      >
        <SubSection title="Background Information">
          <Summary market={market}/>
        </SubSection>
      </Grid>
      <Grid
        item
        xs={12}
      >
        <SubSection>
          <CommentBox comments={marketComments} commentsHash={commentsHash} marketId={marketId}/>
        </SubSection>
      </Grid>
    </Grid>
  );
}

DecisionDialog.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  investibles: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  comments: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  commentsHash: PropTypes.object,
  // eslint-disable-next-line react/forbid-prop-types
  marketStages: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  myPresence: PropTypes.object.isRequired,

};

DecisionDialog.defaultProps = {
  investibles: [],
  comments: [],
  commentsHash: {},
  marketStages: [],
  isAdmin: false,
};

export default DecisionDialog;
