import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent } from '@material-ui/core';
import QuillEditor from '../TextEditors/QuillEditor';
import CommentBox from '../../containers/CommentBox/CommentBox';
import InvestibleEditButton from './InvestibleEditButton';
import Voting from '../DecisionDialogs/Voting';

function InvestibleView(props) {

  const { investible, comments, commentsHash, editToggle, marketId } = props;

  const { description } = investible; // this will be broken for multi market investibles;
  return (
    <Card>
      <CardContent>
        <InvestibleEditButton onClick={editToggle} />
        <Voting investible={investible} marketId={marketId} investmentEnabled={true} />
        <QuillEditor marketId={marketId} defaultValue={description} readOnly={true} />
      </CardContent>
      <CommentBox investible={investible} marketId={marketId} comments={comments} depth={0}
                  commentsHash={commentsHash} />
    </Card>
  );
}

InvestibleView.propTypes = {
  investible: PropTypes.object.isRequired,
};

export default InvestibleView;
