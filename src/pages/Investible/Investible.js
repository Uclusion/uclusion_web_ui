import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import Screen from '../../containers/Activity/Screen';
import {
  makeBreadCrumbs,
  formMarketLink,
  decomposeMarketPath
} from '../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import QuillEditor from '../../components/TextEditors/QuillEditor';
import CommentBox from '../../containers/CommentBox/CommentBox';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import _ from 'lodash';
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper';
import SubSection from '../../containers/SubSection/SubSection';
import { Paper, Typography } from '@material-ui/core';

const emptyInvestible = { investible: { name: '', description: '' } };
const emptyMarket = { name: '' };


function createCommentsHash(commentsArray) {
  return _.keyBy(commentsArray, 'id');
}


function Investible(props) {
  const { hidden } = props;
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  const { marketId, investibleId } = decomposeMarketPath(pathname);
  const [marketsState] = useContext(MarketsContext);
  const market = getMarket(marketsState, marketId) || emptyMarket;
  const [commentsState] = useContext(CommentsContext);
  const comments = getMarketComments(commentsState, marketId);
  const investibleComments = comments.filter((comment) => comment.investible_id === investibleId);
  const commentsHash = createCommentsHash(investibleComments);
  const [investiblesState] = useContext(InvestiblesContext);
  const inv = getInvestible(investiblesState, investibleId) || emptyInvestible; // fallback for initial render
  const { investible } = inv;
  const { name, description } = investible;
  const breadCrumbTemplates = [{ name: market.name, link: formMarketLink(marketId) }];
  const breadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
  console.log(description);
  return (
    <Screen
      title={name}
      breadCrumbs={breadCrumbs}
      hidden={hidden}
    >
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
      <CommentBox comments={investibleComments} commentsHash={commentsHash} marketId={marketId} />
    </Screen>
  );
}

Investible.propTypes = {
  hidden: PropTypes.bool,
};

Investible.defaultProps = {
  hidden: false,
};

export default Investible;