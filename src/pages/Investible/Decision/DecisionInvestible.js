import React from 'react';
import PropTypes from 'prop-types';
import SubSection from '../../../containers/SubSection/SubSection';
import YourVoting from './Voting/YourVoting';
import Voting from './Voting';
import { Paper, Fab } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { JUSTIFY_TYPE } from '../../../constants/comments';

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
    toggleEdit,
    isAdmin,
  } = props;
  const investmentReasonsRemoved = investibleComments.filter((comment) => comment.comment_type !== JUSTIFY_TYPE);
  const investmentReasons = investibleComments.filter((comment) => comment.comment_type === JUSTIFY_TYPE);
  const { description } = investible;
  if (!investibleId) {
    //we have no usable data;
    return <React.Fragment />;
  }

  return (
    <React.Fragment>
      {isAdmin && (
        <Fab
          color="primary"
        >
          <EditIcon onClick={toggleEdit} />
        </Fab>
      )}
      <SubSection
        title="Your Voting"
      >
        <YourVoting
          investibleId={investibleId}
          marketPresences={marketPresences}
          comments={investmentReasons}
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
          comments={investmentReasons}
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

      <CommentBox comments={investmentReasonsRemoved} commentsHash={commentsHash} marketId={marketId} />

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
  toggleEdit: PropTypes.func,
  isAdmin: PropTypes.bool,
};

DecisionInvestible.defaultProps = {
  marketPresences: [],
  investibleComments: [],
  commentsHash: {},
  toggleEdit: () => {},
  isAdmin: false,
};
export default DecisionInvestible;