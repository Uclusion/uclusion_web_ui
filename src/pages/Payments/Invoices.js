import React, { useContext } from 'react';
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
          No Invoices
        </Typography>
      );
    }
    return invoices.map((invoice) => {
      const { total, created, invoice_pdf } = invoice;
      const totalDollars = total / 100.0;
      const milliCreated = created * 1000;
      const createdDate = new Date(milliCreated);
      const formattedDate = intl.formatDate(createdDate);
      return (<Card>
        <Typography>
          Invoice Date: {formattedDate}, Amount: {totalDollars}
        </Typography>
        <Link href={invoice_pdf} target="_blank">PDF</Link>
      </Card>);
    });
  }

  return (
    <Card>
      {getInvoiceData()}
    </Card>
  );
}

export default Invoices;