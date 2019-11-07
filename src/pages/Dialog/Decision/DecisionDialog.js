/**
 * A component that renders a _decision_ dialog
 */
import React from 'react';
import PropTypes from 'prop-types';
import Summary from '../Summary';
import Investibles from './Investibles';
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
  } = props;
  const underConsiderationStage = marketStages.find((stage) => stage.allows_investment);
  const proposedStage = marketStages.find((stage) => !stage.allows_investment && !stage.appears_in_market_summary);

  function getInvestiblesForStage(stage) {
    console.log(stage);
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
  const underConsideration = getInvestiblesForStage(underConsiderationStage);
  console.log(underConsideration);
  const proposed = getInvestiblesForStage(proposedStage);

  const { id: marketId } = market;


  return (
    <div>
      <SubSection
        title="Current Voting"
        >
        <Voting/>
      </SubSection>
      <SubSection
        title="Current Options"
      >
        <Investibles investibles={underConsideration} marketId={marketId} comments={comments} />
      </SubSection>
      <SubSection
        title="Proposed Options"
      >
        <Investibles investibles={proposed} marketId={marketId} comments={comments} />
      </SubSection>
      <SubSection title="Background Information">
        <Summary market={market}/>
      </SubSection>
      <SubSection>
        <CommentBox comments={comments} commentsHash={commentsHash} marketId={marketId} />
      </SubSection>
    </div>
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
};

DecisionDialog.defaultProps = {
  investibles: [],
  comments: [],
  commentsHash: {},
  marketStages: [],
};

export default DecisionDialog;
