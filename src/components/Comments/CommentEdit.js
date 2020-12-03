import React, { useContext, useState } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import {
  Button,
  Card,
  CardActions,
  CardContent,
  darken,
  FormControl,
  FormControlLabel,
  makeStyles,
  Radio,
  RadioGroup
} from '@material-ui/core'
import PropTypes from 'prop-types'
import QuillEditor from '../TextEditors/QuillEditor'
import { updateComment } from '../../api/comments'
import { processTextAndFilesForSave } from '../../api/files'
import SpinBlockingButton from '../SpinBlocking/SpinBlockingButton'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { addCommentToMarket } from '../../contexts/CommentsContext/commentsContextHelper'
import { EMPTY_SPIN_RESULT } from '../../constants/global'
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../constants/comments'
import { urlHelperGetName } from '../../utils/marketIdPathFunctions'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import _ from 'lodash';
import clsx from 'clsx'
import { getIcon } from '../../containers/CommentBox/CommentAddBox'

const useStyles = makeStyles((theme) => ({
  hidden: {
    display: 'none',
  },
  add: {},
  visible: {
    overflow: 'visible'
  },
  cardContent: {
    padding: 0,
  },
  cardActions: {
    padding: 8,
  },
  buttonPrimary: {
    backgroundColor: '#2d9cdb',
    color: '#fff',
    "&:hover": {
      backgroundColor: darken('#2d9cdb', 0.08)
    },
    "&:focus": {
      backgroundColor: darken('#2d9cdb', 0.24)
    },
  },
  todoLabelType: {
    alignSelf: "start",
    display: "inline-flex"
  },
  commentType: {
    [theme.breakpoints.down('sm')]: {
      display: 'block',
      marginLeft: 'auto',
      marginRight: 'auto'
    },
    paddingBottom: '15px'
  },
  commentTypeGroup: {
    display: "flex",
    flexDirection: "row",
    [theme.breakpoints.down('sm')]: {
      display: 'block'
    }
  },
  chipItem: {
    color: '#fff',
    borderRadius: '8px',
    '& .MuiChip-label': {
      fontSize: 12,
    },
    '& .MuiFormControlLabel-label': {
      paddingRight: '5px',
      fontWeight: 'bold',
      textTransform: 'capitalize',
      [theme.breakpoints.down('sm')]: {
        height: '100%',
        verticalAlign: 'middle',
        display: 'inline-block',
        '& .MuiSvgIcon-root': {
          display: 'block'
        }
      },
    },
    '& .MuiChip-avatar': {
      width: '16px',
      height: '14px',
      color: '#fff',
    },
    '& .MuiRadio-colorPrimary.Mui-checked':{
      '&.Mui-checked': {
        color: 'white'
      }
    },
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    margin: theme.spacing(0, 0, 0, 4),
    [theme.breakpoints.down('sm')]: {
      margin: '10px'
    },
  },
  selected: {
    opacity: 1
  },
  unselected: {
    opacity: '.6'
  },
  chipItemQuestion: {
    background: '#2F80ED',
  },
  chipItemIssue: {
    background: '#E85757',
    color: 'black'
  },
  chipItemSuggestion: {
    background: '#e6e969',
    color: 'black'
  },
  chipItemTodo: {
    background: '#F29100',
    color: 'black'
  },
  chipItemFor: {
    background: '#73B76C',
  },
  chipItemAgainst: {
    background: '#D54F22',
  },
  chipItemReport: {
    background: '#73B76C',
  },
  commentTypeContainer: {
    borderRadius: '4px 4px 0 0'
  }
}), { name: 'CommentEdit' });

function CommentEdit(props) {
  const {
    intl, marketId, onSave, onCancel, comment, allowedTypes, myNotificationType
  } = props;
  const { id, body: initialBody, uploaded_files: initialUploadedFiles, comment_type: commentType,
    inline_market_id: inlineMarketId } = comment;
  const [body, setBody] = useState(initialBody);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const classes = useStyles();
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [type, setType] = useState(commentType);
  const [marketState] = useContext(MarketsContext);
  const [investibleState] = useContext(InvestiblesContext);

  function onEditorChange(content) {
    setBody(content);
  }

  function handleSave() {
    const newUploadedFiles = _.uniqBy([...initialUploadedFiles, ...uploadedFiles], 'path');
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(newUploadedFiles, body);
    const updatedType = type !== commentType ? type : undefined;
    return updateComment(marketId, id, tokensRemoved, filteredUploads, updatedType, myNotificationType)
      .then((comment) => {
        addCommentToMarket(comment, commentState, commentDispatch);
        return EMPTY_SPIN_RESULT;
      })
  }

  function onS3Upload(metadatas) {
    setUploadedFiles(metadatas);
  }

  function handleCancel() {
    onCancel();
  }

  function onTypeChange(event) {
    const { value } = event.target;
    setType(value);
  }

  return (
    <div
      className={classes.add}
    >
      <Card elevation={0} className={classes.visible} >
        <CardContent className={classes.cardContent}>
          {allowedTypes.length > 1 && !inlineMarketId && (
            <FormControl component="fieldset" className={classes.commentType}>
              <RadioGroup
                aria-labelledby="comment-type-choice"
                className={classes.commentTypeGroup}
                onChange={onTypeChange}
                value={type}
                row
              >
                {allowedTypes.map((commentType) => {
                  return (
                    <FormControlLabel
                      key={commentType}
                      className={clsx(
                        commentType === ISSUE_TYPE
                          ? `${classes.chipItem} ${classes.chipItemIssue}`
                          : commentType === QUESTION_TYPE ? `${classes.chipItem} ${classes.chipItemQuestion}`
                          : commentType === SUGGEST_CHANGE_TYPE ? `${classes.chipItem} ${classes.chipItemSuggestion}`
                            : commentType === TODO_TYPE ? `${classes.chipItem} ${classes.chipItemTodo}`
                              : `${classes.chipItem} ${classes.chipItemReport}`,
                        type === commentType ? classes.selected : classes.unselected
                      )}
                      /* prevent clicking the label stealing focus */
                      onMouseDown={e => e.preventDefault()}
                      control={<Radio color="primary" />}
                      label={window.outerWidth < 600 ? getIcon(commentType) :
                        <FormattedMessage id={`${commentType.toLowerCase()}Present`} />}
                      labelPlacement="end"
                      value={commentType}
                    />
                  );
                })}
              </RadioGroup>
            </FormControl>
          )}
          <QuillEditor
            defaultValue={initialBody}
            marketId={marketId}
            onChange={onEditorChange}
            onS3Upload={onS3Upload}
            setOperationInProgress={setOperationRunning}
            getUrlName={urlHelperGetName(marketState, investibleState)}
          />
        </CardContent>
        <CardActions className={classes.cardActions}>
          <Button
            onClick={handleCancel}
            disabled={operationRunning}
            variant="text"
            size="small"
          >
            {intl.formatMessage({ id: 'cancel' })}
          </Button>
          <SpinBlockingButton
            className={classes.buttonPrimary}
            disabled={operationRunning}
            variant="contained"
            size="small"
            marketId={marketId}
            onClick={handleSave}
            hasSpinChecker
            onSpinStop={onSave}
          >
            {intl.formatMessage({ id: 'save' })}
          </SpinBlockingButton>

        </CardActions>
      </Card>
    </div>
  );
}

CommentEdit.propTypes = {
  allowedTypes: PropTypes.arrayOf(PropTypes.string),
  marketId: PropTypes.string.isRequired,
  onSave: PropTypes.func,
  // eslint-disable-next-line react/forbid-prop-types
  intl: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  comment: PropTypes.object.isRequired,
  onCancel: PropTypes.func,
};

CommentEdit.defaultProps = {
  allowedTypes: [],
  onCancel: () => {
  },
  onSave: () => {
  },
};

export default injectIntl(CommentEdit);
