import React, { useContext, useState } from 'react'
import { useHistory } from 'react-router'
import PropTypes from 'prop-types'
import { FormattedMessage, useIntl } from 'react-intl'
import _ from 'lodash'
import {
  createTitle, formCommentLink,
  formMarketLink,
  makeBreadCrumbs,
  navigate,
} from '../../../utils/marketIdPathFunctions'
import Screen from '../../../containers/Screen/Screen'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import {
  getMarket,
  getMarketDetailsForType,
  getNotHiddenMarketDetailsForUser
} from '../../../contexts/MarketsContext/marketsContextHelper'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import {
  Card,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Tooltip
} from '@material-ui/core'
import { PLANNING_TYPE } from '../../../constants/markets'
import { TODO_TYPE } from '../../../constants/comments'
import CommentAdd from '../../../components/Comments/CommentAdd'
import { getPageReducerPage, usePageStateReducer } from '../../../components/PageState/pageStateHooks'
import { notifyImmediate } from '../../../utils/commentFunctions'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import clsx from 'clsx'
import { useStyles } from '../../../containers/CommentBox/CommentAddBox'

function TodoAdd(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const classes = useStyles();
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [chosenMarketId, setChosenMarketId] = useState(undefined);
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  const planningDetails = getMarketDetailsForType(myNotHiddenMarketsState, marketPresencesState, PLANNING_TYPE) || [];
  const firstMarketId = _.isEmpty(planningDetails) ? undefined : planningDetails[0].id;
  const marketPresences = getMarketPresences(marketPresencesState, chosenMarketId || firstMarketId) || [];
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  const [commentAddStateFull, commentAddDispatch] = usePageStateReducer('commentAddTop');
  const [commentAddState, updateCommentAddState, commentAddStateReset] =
    getPageReducerPage(commentAddStateFull, commentAddDispatch, chosenMarketId || firstMarketId);
  const {
    notificationType,
  } = commentAddState;
  const market = getMarket(marketsState, chosenMarketId || firstMarketId) || {};
  const breadCrumbTemplates = [{ name: market.name, link: formMarketLink(market.id) }];
  const myBreadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
  const title = intl.formatMessage({ id: 'newTODO'});

  const navigationMenu = (chosenMarketId || firstMarketId) ? {
    navMenu:(
      <FormControl variant="filled" sx={{ m: 1, minWidth: 120 }} style={{border: '1px solid #ced4da'}}>
        <InputLabel id="workspaceNav">
          {intl.formatMessage({id: 'MarketSearchResultWorkspace'})}
        </InputLabel>
        <Select
          labelId="workspaceSelectLabel"
          id="workspaceSelect"
          value={chosenMarketId || firstMarketId}
          onChange={(event) => {
            const { value } = event.target;
            setChosenMarketId(value);
          }}
        >
          {planningDetails.map((aMarket) => {
            return (
              <MenuItem value={aMarket.id} key={`menu${aMarket.id}`}>
                {createTitle(aMarket.name, 20)}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    ), showSearch: false
  } : undefined;

  function onCreate(comment) {
    commentAddStateReset();
    if (comment) {
      notifyImmediate(myPresence.id, comment, market, messagesDispatch);
      navigate(history, formCommentLink(market.id, undefined, comment.id));
    } else {
      navigate(history, '/inbox');
    }
  }

  function onTypeChange(event) {
    const { value } = event.target;
    updateCommentAddState({notificationType: value});
  }

  return (
    <Screen
      title={title}
      hidden={hidden}
      tabTitle={title}
      breadCrumbs={myBreadCrumbs}
      loading={_.isEmpty(firstMarketId)}
      navigationOptions={navigationMenu}
      noLeftPadding
    >
      <Card id="commentAddBox" style={{marginBottom: '2rem', overflow: 'unset', marginTop: '3rem'}} elevation={3}>
        <FormControl component="fieldset" className={classes.commentType}>
          <RadioGroup
            aria-labelledby="comment-type-choice"
            className={classes.commentTypeGroup}
            onChange={onTypeChange}
            value={notificationType || ''}
            row
          >
            {['RED', 'YELLOW', 'BLUE'].map((commentType) => {
              return (
                <Tooltip key={`todoTip${commentType}`}
                         title={<FormattedMessage id={`${commentType.toLowerCase()}Tip`} />}>
                  <FormControlLabel
                    id={`commentAddLabel${commentType}`}
                    key={commentType}
                    className={clsx(
                      commentType === 'RED' ? `${classes.chipItem} ${classes.chipItemIssue}`
                        : (commentType === 'BLUE' ? `${classes.chipItem} ${classes.chipItemQuestion}`
                          : `${classes.chipItemBlack} ${classes.chipItemSuggestion}`),
                      notificationType === commentType ? classes.selected : classes.unselected)}
                    /* prevent clicking the label stealing focus */
                    onMouseDown={e => e.preventDefault()}
                    control={<Radio color="primary" />}
                    label={<FormattedMessage id={ `notificationLabel${commentType}`} />}
                    labelPlacement="end"
                    value={commentType}
                  />
                </Tooltip>
              );
            })}
          </RadioGroup>
        </FormControl>
        <div className={classes.addBox}>
          <CommentAdd
            nameKey="CommentAddTop"
            type={TODO_TYPE}
            defaultNotificationType={notificationType}
            commentAddState={commentAddState}
            updateCommentAddState={updateCommentAddState}
            commentAddStateReset={commentAddStateReset}
            marketId={chosenMarketId || firstMarketId}
            mentionsAllowed={false}
            onSave={onCreate}
            onDone={onCreate}
            isStandAlone
            isStory={false} />
        </div>
      </Card>
    </Screen>
  );
}

TodoAdd.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default TodoAdd;
