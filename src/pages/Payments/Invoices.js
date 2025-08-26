import React, { Suspense, useState } from 'react';
import _ from 'lodash';
import { Card, Link, Typography, useTheme } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { makeStyles } from '@material-ui/styles';
import SubSection from '../../containers/SubSection/SubSection';
import { getInvoices } from '../../api/users';
import { AwaitComponent, useAsyncLoader } from '../../utils/PromiseUtils';


const useStyles = makeStyles(() => {
  return {
    table: {
      border: '1px solid',
      width: '100%',
      tableLayout: 'fixed'
    },
    td: {
      border: '1px dashed',
      textAlign: 'right',
    },

  };
});

function Invoices() {
  const { loader } = useAsyncLoader(getInvoices);
  const [invoices, setInvoices] = useState(undefined);
  const intl = useIntl();
  const theme = useTheme();
  const classes = useStyles(theme);

  const fallBack = <div />;

  function LoadInvoicesInfo(invoicesInfo) {
    if (invoicesInfo) {
      setInvoices(invoicesInfo);
    }
    if (invoices !== undefined) {
      if (invoices.length === 0) {
        return (
          <Typography>
            No invoices have been sent to your account.
          </Typography>
        );
      }
      return (
        <Card>
          <SubSection
            title="Invoices"
            padChildren
          >
            <table className={classes.table}>
              <thead>
              <tr className={classes.tr}>
                <th className={classes.th}>
                  Date
                </th>
                <th className={classes.th}>
                  Amount
                </th>
                <th className={classes.th}>
                  PDF
                </th>
              </tr>
              </thead>
              <tbody>
              {getSortedInvoices()}
              </tbody>
            </table>
          </SubSection>
        </Card>
      );
    }
    return fallBack;
  }

  function getSortedInvoices () {
    const sortedInvoices = _.sortBy(invoices, 'created').reverse();
    return sortedInvoices.map((invoice) => {
      const { total, created, invoice_pdf } = invoice;
      const totalDollars = total / 100.0;
      const milliCreated = created * 1000;
      const createdDate = new Date(milliCreated);
      const formattedDate = intl.formatDate(createdDate);
      return (
        <tr key={created} className={classes.tr}>
          <td className={classes.td}>
            <Typography>
              {formattedDate}
            </Typography>
          </td>
          <td className={classes.td}>
            <Typography>
              {totalDollars}
            </Typography>
          </td>
          <td className={classes.td}>
            <Link href={invoice_pdf} target="_blank">Download</Link>
          </td>
        </tr>
      );
    });
  }

  return (
    <Suspense fallback={fallBack}>
      <AwaitComponent 
        loader={loader}
        render={LoadInvoicesInfo}
      />
    </Suspense>
  );
}

export default Invoices;