import React from 'react';
import PropTypes from 'prop-types';
import SubSection from '../../../containers/SubSection/SubSection';
import YourVoting from './Voting/YourVoting';
import Voting from './Voting';
import { Paper } from '@material-ui/core';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
import CommentBox from '../../../containers/CommentBox/CommentBox';

/**
 * A page that represents what the investible looks like for a DECISION Dialog
 * @param props
 * @constructor
 */
function DecisionInvestible(props) {

  const {
    investibleId,
    marketPresences,
    investibleComments,
    userId,
    marketId,
    investible,
    commentsHash,
  } = props;

  const { name, description } = investible;

  return (
    <React.Fragment>
      <SubSection
        title="Your Voting"
      >
        <YourVoting
          investibleId={investibleId}
          marketPresences={marketPresences}
          comments={investibleComments}
          userId={userId}
          marketId={marketId}
        />
      </SubSection>

      <SubSection
        title="Others Voting"
      >
        <Voting
          investibleId={investibleId}
          marketPresences={marketPresences}
          comments={investibleComments}
        />
      </SubSection>
      <SubSection
        title='Description'
      >
        <Paper>
          <QuillEditor
            readOnly
            defaultValue={description}
          />
        </Paper>
      </SubSection>
      <CommentBox comments={investibleComments} commentsHash={commentsHash} marketId={marketId} />\
    </React.Fragment>
  );
}

DecisionInvestible.propTypes = {
  marketId: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  investible: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  investibleComments: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  commentsHash: PropTypes.object,
  investibleId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
};

DecisionInvestible.defaultProps = {
  marketPresences: [],
  investibleComments: [],
  commentsHash: {},
};
export default DecisionInvestible;