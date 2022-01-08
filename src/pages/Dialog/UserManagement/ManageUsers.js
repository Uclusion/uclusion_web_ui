import React from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx';
import { CardActions, CardContent } from '@material-ui/core'
import { usePlanFormStyles } from '../../../components/AgilePlan'
import AddNewUsers from './AddNewUsers'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import { Clear } from '@material-ui/icons'
import { useIntl } from 'react-intl'

function ManageUsers (props) {
  const {
    market,
    onCancel,
    isInbox
  } = props;
  const classes = usePlanFormStyles();
  const intl = useIntl();

  return (
    <>
      <CardContent className={clsx(classes.cardContent, classes.nestedCard)} style={{paddingBottom: '1rem'}}>
        <AddNewUsers market={market} />
      </CardContent>
      {!isInbox && (
        <CardActions style={{display: 'flex'}}>
          <SpinningIconLabelButton onClick={onCancel} doSpin={false} icon={Clear} id='addressAddCancel'
                                   style={{marginLeft: 'auto', marginRight: 'auto'}}>
            {intl.formatMessage({ id: 'addressAddCancelLabel' })}
          </SpinningIconLabelButton>
        </CardActions>
      )}
    </>
  );
}

ManageUsers.propTypes = {
  market: PropTypes.object.isRequired,
  onAddNewUsers: PropTypes.func,
};

ManageUsers.defaultProps = {
  onAddNewUsers: () => {}
};

export default ManageUsers;