import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import InfoIcon from '@material-ui/icons/Info';
import { useMetaDataStyles } from '../../pages/Investible/Planning/PlanningInvestibleNav';
import { Tooltip } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(theme => ({
  fieldset: {
    border: "none",
    display: "inline-block",
    padding: theme.spacing(0),
    "& > *": {
      margin: theme.spacing(2),
      "&:first-child, &:last-child": {
        marginLeft: 0,
        marginRight: 0
      }
    }
  },
}));

function InfoText(props) {
  const {
    textId,
    useDl,
    children
  } = props;
  const intl = useIntl();
  const metaClasses = useMetaDataStyles();
  const classes = useStyles();

  function getInterior() {
    return (
      <>
        <Tooltip title={intl.formatMessage({ id: textId })}>
          <InfoIcon color='primary' className={metaClasses.expirationProgress} />
        </Tooltip>
        {children}
      </>
    )
  }
  if (useDl) {
    return (
      <dl className={metaClasses.root}>
        {getInterior()}
      </dl>
    )
  }
  return (
    <fieldset className={classes.fieldset}>
      {getInterior()}
    </fieldset>
  );
}

InfoText.propTypes = {
  textId: PropTypes.string.isRequired,
  children: PropTypes.any.isRequired,
  useDl: PropTypes.bool,
};

InfoText.defaultProps = {
  useDl: true,
};

export default InfoText;
