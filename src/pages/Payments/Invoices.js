import React, { useContext, Fragment } from 'react';
import _ from 'lodash';
import { Card, Link, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { getCurrentInvoices } from '../../contexts/AccountContext/accountContextHelper';

function Invoices (props) {

  const [accountState] = useContext(AccountContext);
  const invoices = getCurrentInvoices(accountState);
  const intl = useIntl();

  function getInvoiceData () {
    if (_.isEmpty(invoices)) {
      return (
        <Typography>
          <strong>No Invoices</strong>
        </Typography>
      );
    }
    const sortedInvoices = _.sortBy(invoices, 'created').reverse();
    return sortedInvoices.map((invoice) => {
      const { total, created, invoice_pdf } = invoice;
      const totalDollars = total / 100.0;
      const milliCreated = created * 1000;
      const createdDate = new Date(milliCreated);
      const formattedDate = intl.formatDate(createdDate);
      return (
        <Fragment>
          <Typography>
            Invoice Date: {formattedDate}, Amount: {totalDollars}
          </Typography>
          <Link href={invoice_pdf} target="_blank">PDF</Link>
        </Fragment>
      );
    });
  }

  return (
    <Card elevation={0} style={{padding: '1rem'}}>
      {getInvoiceData()}
    </Card>
  );
}

export default Invoices;