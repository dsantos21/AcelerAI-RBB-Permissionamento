// Libs
import React from 'react';
import PropTypes from 'prop-types';
// Rimble Components
import { Flex } from 'rimble-ui';
// Components
import TextWithTooltip from './TextWithTooltip';
import TextLinkWithTooltip from './TextLinkWithTooltip';
// Styles
import styles from './styles.module.scss';

type PermissionRow = {
  isAdmin: boolean;
  type: string;
  authorizer: string;
  authorized: string;
  date: string;
  txHash: string;
  status: string;
};

const PermissionRow: React.FC<PermissionRow> = ({ isAdmin, type, authorizer, authorized, date, txHash, status }) => (
  <tr className={styles.row}>
    <td>
      <Flex alignItems="center" className={styles.tooltipFix}>
        <TextWithTooltip isAdmin={isAdmin} status={status} text={authorizer} />
      </Flex>
    </td>
    <td>
      <Flex alignItems="center" className={styles.tooltipFix}>
        <TextWithTooltip isAdmin={isAdmin} status={status} text={authorized} />
      </Flex>
    </td>
    <td>
      <Flex alignItems="center" className={styles.tooltipFix}>
        <TextWithTooltip isAdmin={isAdmin} status={status} text={date} />
      </Flex>
    </td>
    <td>
      <Flex alignItems="center" className={styles.tooltipFix}>
        <TextLinkWithTooltip
          isAdmin={isAdmin}
          status={status}
          text={txHash}
          link={'http://localhost:8080/tx/' + txHash}
        />
      </Flex>
    </td>
  </tr>
);

PermissionRow.propTypes = {
  type: PropTypes.string.isRequired,
  authorizer: PropTypes.string.isRequired,
  authorized: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  txHash: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  isAdmin: PropTypes.bool.isRequired
};

export default PermissionRow;
