import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Grid, Typography } from '@material-ui/core'
import _ from 'lodash'
import RaisedCard from '../../../components/Cards/RaisedCard'
import { useIntl } from 'react-intl'
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { makeStyles } from '@material-ui/core/styles'
import { yellow } from '@material-ui/core/colors'
import { SECTION_TYPE_SECONDARY_WARNING } from '../../../constants/global'
import SubSection from '../../../containers/SubSection/SubSection'
import ReadOnlyQuillEditor from '../../../components/TextEditors/ReadOnlyQuillEditor'
import Comment from '../../../components/Comments/Comment'
import { TODO_TYPE } from '../../../constants/comments'

const myClasses = makeStyles(
  theme => {
    return {
      warn: {
        border: `1px solid ${theme.palette.grey["400"]}`,
        borderRadius: theme.spacing(1),
        padding: theme.spacing(1, 2),
        backgroundColor: yellow["400"],
      },
      outlined: {
        border: `1px solid ${theme.palette.grey["400"]}`,
        borderRadius: theme.spacing(1),
        padding: theme.spacing(1, 2),
      },
      white: {
        backgroundColor: "white",
        padding: 0,
        margin: 0
      }
    };
  },
  { name: "Archive" }
);

function MarketTodos(props) {
  const {
    comments,
    marketId,
  } = props;
  const classes = myClasses();
  const intl = useIntl();
  const history = useHistory();
  const [editCard, setEditCard] = useState(undefined);

  function getCards(comments, marketId, history, intl) {
    const sortedData = _.sortBy(comments, 'updated_at').reverse();
    const classes = myClasses();
    return sortedData.map((comment) => {
      const { id, body, updated_at } = comment;
      return (
        <Grid
          key={id}
          item
          md={3}
          xs={12}
        >
          <RaisedCard onClick={() => setEditCard(comment)} elevation={0}>
            <div className={classes.outlined}>
              <Typography style={{fontSize: '.75rem', flex: 1}}>Updated: {intl.formatDate(updated_at)}</Typography>
              <ReadOnlyQuillEditor value={body} />
            </div>
          </RaisedCard>
        </Grid>
      );
    });
  }

  return (
    <>
      {editCard && (
        <Comment
          depth={0}
          marketId={marketId}
          comment={editCard}
          onDone={() => setEditCard(undefined)}
          comments={comments}
          allowedTypes={[TODO_TYPE]}
          editOpenDefault
          noReply
          noAuthor
        />
      )}
      <SubSection
        type={SECTION_TYPE_SECONDARY_WARNING}
        title={intl.formatMessage({ id: 'immediate' })}
        helpTextId="immediateSectionHelp"
      >
        <Grid
          container
          className={classes.white}
        >
          {getCards(comments, marketId, history, intl)}
        </Grid>
        <hr />
      </SubSection>
    </>
  );
}

MarketTodos.propTypes = {
  comments: PropTypes.arrayOf(PropTypes.object),
  marketId: PropTypes.string.isRequired,
};

MarketTodos.defaultProps = {
  comments: [],
};

export default MarketTodos;
