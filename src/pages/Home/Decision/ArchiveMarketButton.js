import React from 'react';
import PropTypes from 'prop-types';
import ArchiveIcon from '@material-ui/icons/Archive';
import { archiveMarket } from '../../../api/markets';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';

function ArchiveMarketButton(props) {
  const {
    marketId,
    onClick,
  } = props;

  function myOnClick() {
    return archiveMarket(marketId);
  }

  return (
    <SpinBlockingButton
      marketId={marketId}
      onClick={myOnClick}
      onSpinStop={onClick}
    >
      <TooltipIconButton
        translationId="decisionDialogsArchiveDialog"
        icon={<ArchiveIcon />}
      />
    </SpinBlockingButton>
  );
}

ArchiveMarketButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

ArchiveMarketButton.defaultProps = {
  onClick: () => {
  },
};

export default ArchiveMarketButton;
