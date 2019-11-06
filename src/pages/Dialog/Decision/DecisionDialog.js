/**
 * A component that renders a _decision_ dialog
 */
import React from 'react';
import PropTypes from 'prop-types';
import Summary from '../Summary';
import Investibles from '../Investibles';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import SubSection from '../../../containers/SubSection/SubSection';

function DecisionDialog(props) {

  const { market, investibles, comments, commentsHash } = props;
  const { id: marketId } = market;


  return (
    <div>
      <SubSection title='Voting' />
      <SubSection title='Description'>
        <Summary market={market} />
      </SubSection>
      <SubSection title='Ideas Under Consideration'>
        {investibles && <Investibles investibles={investibles} marketId={marketId} />}
      </SubSection>
        <SubSection title='Proposed Ideas' />
      <SubSection title='Comments'>
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
  comments: PropTypes.arrayOf(PropTypes.object),
  commentsHash: PropTypes.object,
};

DecisionDialog.defaultProps = {
  investibles: [],
};

export default DecisionDialog;
