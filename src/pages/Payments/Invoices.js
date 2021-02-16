import React, { useContext } from 'react';
import _ from 'lodash';
import { Card, Link, Typography, useTheme } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { getCurrentInvoices } from '../../contexts/AccountContext/accountContextHelper';
import { makeStyles } from '@material-ui/styles';
import SubSection from '../../containers/SubSection/SubSection';


const useStyles = makeStyles((theme) => {
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

function Invoices (props) {

  const [accountState] = useContext(AccountContext);
  const invoices = getCurrentInvoices(accountState);
  const intl = useIntl();
  const theme = useTheme();
  const classes = useStyles(theme);
  if (_.isEmpty(invoices)) {
    return (
      <Typography>
        No invoices have been sent to your account.
      </Typography>
    );
  }

  function getInvoices () {
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
          {getInvoices()}
          </tbody>
        </table>
      </SubSection>
    </Card>
  );
}

export default Invoices;