import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormControl, FormControlLabel, FormLabel, makeStyles, Radio, RadioGroup, Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { TODO_TYPE } from '../../../constants/comments';
import CommentAdd from '../../Comments/CommentAdd';
import { getPageReducerPage, usePageStateReducer } from '../../PageState/pageStateHooks';
import { formCommentLink, formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { FormattedMessage } from 'react-intl';

const useStyles = makeStyles(
  theme => {
    return {
      certaintyLabel: {
        marginBottom: theme.spacing(2),
        textTransform: "capitalize"
      },
      certaintyValue: {
        borderRadius: 6,
        paddingLeft: theme.spacing(1),
        margin: theme.spacing(0, 2, 2, 0)
      },
      certaintyValueLabel: {
        fontWeight: "bold"
      },
    };
  },
  { name: "VoteAdd" }
);

function BugDescriptionStep (props) {
  const { marketId, groupId, updateFormData, formData } = props;
  const history = useHistory();
  const [commentAddBugStateFull, commentAddBugDispatch] = usePageStateReducer('addBugWizard');
  const [commentAddBugState, updateCommentAddBugState, commentAddStateBugReset] =
    getPageReducerPage(commentAddBugStateFull, commentAddBugDispatch, groupId);
  const classes = useContext(WizardStylesContext);
  const radioClasses = useStyles();
  const { newQuantity } = formData;

  function onChange(event) {
    updateFormData({
      newQuantity: event.target.value
    });
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
    <div>
      <Typography className={classes.introText}>
        How would you describe this bug?
      </Typography>
      <FormControl>
        <FormLabel
          className={radioClasses.certaintyLabel}
          id="add-vote-certainty"
        >
        </FormLabel>
        <RadioGroup
          aria-labelledby="add-vote-certainty"
          style={{display: 'flex', flexDirection: 'row'}}
          onChange={onChange}
          value={newQuantity || ''}
        >
          {['RED', 'YELLOW', 'BLUE'].map(certainty => {
            return (
              <FormControlLabel
                key={certainty}
                id={`${certainty}`}
                className={radioClasses.certaintyValue}
                classes={{
                  label: radioClasses.certaintyValueLabel
                }}
                /* prevent clicking the label stealing focus */
                onMouseDown={e => e.preventDefault()}
                control={<Radio />}
                label={<FormattedMessage id={`notificationLabel${certainty}`} />}
                labelPlacement="start"
                value={certainty}
              />
            );
          })}
        </RadioGroup>
      </FormControl>
      <CommentAdd
        nameKey="CommentAddBug"
        type={TODO_TYPE}
        wizardProps={{...props, isBug: true, bugType: newQuantity,
          goBack: () => navigate(history, formMarketLink(marketId, groupId))}}
        commentAddState={commentAddBugState}
        updateCommentAddState={updateCommentAddBugState}
        commentAddStateReset={commentAddStateBugReset}
        marketId={marketId}
        groupId={groupId}
        onSave={(comment) => navigate(history, formCommentLink(marketId, groupId, undefined, comment.id))}
        nameDifferentiator="addBug"
        isStory={false}
      />
    </div>
    </WizardStepContainer>
  );
}

BugDescriptionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

BugDescriptionStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default BugDescriptionStep;