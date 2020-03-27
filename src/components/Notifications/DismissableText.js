import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import clsx from 'clsx';
import { DISMISS, DismissTextContext } from '../../contexts/DismissTextContext';
import IconButton from '@material-ui/core/IconButton';
import InfoIcon from '@material-ui/icons/Info';
import CloseIcon from '@material-ui/icons/Close';
import { useMetaDataStyles } from '../../pages/Investible/Planning/PlanningInvestible';

function DismissableText(props) {
  const {
    textId,
  } = props;
  const metaClasses = useMetaDataStyles();
  const [dismissState, dispatchDismissState] = useContext(DismissTextContext);

  function dismiss() {
    dispatchDismissState({ type: DISMISS, id: textId });
  }

  if (textId in dismissState) {
    return React.Fragment;
  }

  return (
    <dl className={clsx(metaClasses.group, metaClasses.assignments, metaClasses.root)} >
      <dd>
        <InfoIcon color='primary' className={metaClasses.expirationProgress} />
        <FormattedMessage id={textId} />
        <IconButton onClick={dismiss}>
          <CloseIcon />
        </IconButton>
      </dd>
    </dl>
  );
}

DismissableText.propTypes = {
  textId: PropTypes.string.isRequired,
};

export default DismissableText;
