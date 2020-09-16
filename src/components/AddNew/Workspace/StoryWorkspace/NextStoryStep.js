import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { TextField, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import {
  urlHelperGetName
} from '../../../../utils/marketIdPathFunctions';
import StepButtons from '../../StepButtons';
import QuillEditor from '../../../TextEditors/QuillEditor';
import { DiffContext } from '../../../../contexts/DiffContext/DiffContext';

import { MarketsContext } from '../../../../contexts/MarketsContext/MarketsContext';
import { InvestiblesContext } from '../../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketPresencesContext } from '../../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { VersionsContext } from '../../../../contexts/VersionsContext/VersionsContext';
import { CommentsContext } from '../../../../contexts/CommentsContext/CommentsContext';
import { doCreateStoryWorkspace } from './workspaceCreator';
import { WizardStylesContext } from '../../WizardStylesContext';
import WizardStepContainer from '../../WizardStepContainer';

function NextStoryStep (props) {
  const { updateFormData, formData } = props;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const [marketState, marketsDispatch] = useContext(MarketsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [, versionsDispatch] = useContext(VersionsContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const {
    nextStoryName,
    nextStoryDescription,
    nextStoryUploadedFiles,
  } = formData;
  const [editorContents, setEditorContents] = useState(nextStoryDescription || '');
  const storyName = nextStoryName || '';
  const validForm = !_.isEmpty(nextStoryName);

  function onNameChange (event) {
    const { value } = event.target;
    updateFormData({
      nextStoryName: value
    });
  }

  function onEditorChange (content) {
    setEditorContents(content);
  }

  function onS3Upload (metadatas) {
    const oldUploadedFiles = nextStoryUploadedFiles || [];
    const newUploadedFiles = _.uniqBy([...oldUploadedFiles, ...metadatas], 'path');
    updateFormData({ nextStoryUploadedFiles: newUploadedFiles });
  }

  function createMarket (formData) {
    const dispatchers = {
      diffDispatch,
      investiblesDispatch,
      marketsDispatch,
      presenceDispatch,
      versionsDispatch,
      commentsDispatch,
      commentsState,
    };
    return doCreateStoryWorkspace(dispatchers, formData, updateFormData, intl)
      .then((marketId) => {
        return ({ ...formData, marketId });
      });
  }

  function onPrevious () {
    const newValues = {
      nextStoryDescription: editorContents,
      nextStorySkipped: false,
    };
    updateFormData(newValues);
  }

  function onNext () {
    const newValues = {
      nextStoryDescription: editorContents,
      nextStorySkipped: false,
    };
    updateFormData(newValues);
    return createMarket({ ...formData, ...newValues });
  }

  function onSkip () {
    const newValues = {
      nextStoryDescription: editorContents,
      nextStorySkipped: true,
    };
    updateFormData(newValues);
    return createMarket({ ...formData, ...newValues });
  }

  return (
    <WizardStepContainer
      {...props}
      titleId="OnboardingWizardNextStoryStepLabel"
    >
      <div>
        <Typography variant="body1">
          Do you have a story you want to work on next? If so, enter it here and it will become a "Proposed" story
          in your workspace. Others can approve, <strong>BEFORE</strong> you start work.
          If you don't have one, that's OK, you can add it after the Workspace has been created.
        </Typography>
        <label className={classes.inputLabel}>Name your next story</label>
        <TextField
          className={classes.input}
          value={storyName}
          onChange={onNameChange}
        />
        <QuillEditor
          placeholder={intl.formatMessage({ id: 'OnboardingWizardNextStoryDescriptionPlaceHolder' })}
          value={editorContents}
          defaultValue={editorContents}
          onS3Upload={onS3Upload}
          onChange={onEditorChange}
          getUrlName={urlHelperGetName(marketState, investibleState)}
        />
        <div className={classes.borderBottom}></div>
        <StepButtons
          {...props}
          validForm={validForm}
          showSkip
          spinOnClick
          onPrevious={onPrevious}
          onSkip={onSkip}
          onNext={onNext}/>
      </div>
    </WizardStepContainer>
  );
}

NextStoryStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

NextStoryStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default NextStoryStep;