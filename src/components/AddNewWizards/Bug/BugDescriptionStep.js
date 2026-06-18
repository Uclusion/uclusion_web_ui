import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import {
  makeStyles,
  Typography
} from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import ChoicePills from '../../Buttons/ChoicePills';
import { WizardStylesContext } from '../WizardStylesContext';
import { TODO_TYPE } from '../../../constants/comments';
import CommentAdd, { hasCommentValue } from '../../Comments/CommentAdd';
import { getPageReducerPage, usePageStateReducer } from '../../PageState/pageStateHooks';
import { formCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHotkeys } from 'react-hotkeys-hook';
import { focusEditor } from '../../TextEditors/Utilities/CoreUtils';

export const bugRadioStyles = makeStyles(
  theme => {
    return {
      certaintyLabel: {
        marginBottom: theme.spacing(2),
        textTransform: "capitalize"
      },
      certaintyValue: {
        borderRadius: 6,
        backgroundColor: theme.palette.background.wizard,
        paddingLeft: theme.spacing(1),
        margin: theme.spacing(0, 2, 2, 0),
        '& .MuiRadio-root': {
          color: theme.palette.type === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined,
        },
        '& .MuiRadio-colorSecondary.Mui-checked': {
          color: theme.palette.type === 'dark' ? '#ffffff' : undefined,
        }
      },
      certaintyValueLabel: {
        fontWeight: "bold"
      }
    };
  },
  { name: "VoteAdd" }
);

export function hasBug(groupId) {
  return hasCommentValue(groupId, undefined, 'CommentAddBug', undefined,
    'addBug');
}

function BugDescriptionStep (props) {
  const { marketId, groupId, updateFormData = () => {}, formData = {}, commentType } = props;
  const intl = useIntl();
  const history = useHistory();
  const [commentAddBugStateFull, commentAddBugDispatch] = usePageStateReducer('addBugWizard');
  const [commentAddBugState, updateCommentAddBugState, commentAddStateBugReset] =
    getPageReducerPage(commentAddBugStateFull, commentAddBugDispatch, groupId);
  const classes = useContext(WizardStylesContext);
  const { newQuantity } = formData;
  const defaultFromPage = commentType === undefined ? undefined :
    (commentType === '0' ? 'RED' : (commentType === '1' ? 'YELLOW' : 'BLUE'));

  function onChange(event) {
    updateFormData({
      newQuantity: event.target.value
    });
    const editorName = `addBugCommentAddBug${groupId}-comment-add-editor`;
    focusEditor(editorName);
  }
  const currentQuantity = newQuantity || defaultFromPage || '';

  function simulatePriority(key) {
    return () => {
      const target = {value: key};
      onChange({target});
    };
  }
  useHotkeys('ctrl+alt+1', simulatePriority('RED'), {enableOnContentEditable: true}, []);
  useHotkeys('ctrl+alt+2', simulatePriority('YELLOW'), {enableOnContentEditable: true}, []);
  useHotkeys('ctrl+alt+3', simulatePriority('BLUE'), {enableOnContentEditable: true}, []);
  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText} style={{marginBottom: '1.5rem'}}>
        How would you describe this bug?
      </Typography>
      <ChoicePills
        ariaLabel="add-vote-certainty"
        value={currentQuantity}
        onChange={(value) => onChange({ target: { value } })}
        options={['RED', 'YELLOW', 'BLUE'].map((certainty) => ({
          value: certainty,
          id: `${certainty}`,
          label: <FormattedMessage id={`notificationLabel${certainty}`} />,
          tooltip: intl.formatMessage({ id: `certaintyTip${certainty}` }),
        }))}
      />
      <CommentAdd
        nameKey="CommentAddBug"
        type={TODO_TYPE}
        wizardProps={{...props, isBug: true, bugType: currentQuantity}}
        commentAddState={commentAddBugState}
        updateCommentAddState={updateCommentAddBugState}
        commentAddStateReset={commentAddStateBugReset}
        marketId={marketId}
        groupId={groupId}
        onSave={(comment) => navigate(history, formCommentLink(marketId, groupId, undefined, comment.id))}
        nameDifferentiator="addBug"
      />
    </WizardStepContainer>
  );
}

BugDescriptionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default BugDescriptionStep;