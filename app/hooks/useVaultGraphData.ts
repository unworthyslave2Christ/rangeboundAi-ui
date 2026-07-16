// BY GOD'S GRACE ALONE
import { useEffect, useState } from 'react';

export interface DepositSnapshotData {
  timestamp: string;
  amount0: string;
  amount1: string;
  mintedShares: string;
}

export function useVaultGraphData(userAddress: string | undefined, subgraphUrl: string) {
  const [depositHistory, setDepositHistory] = useState<DepositSnapshotData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!userAddress) {
      setDepositHistory([]);
      return;
    }

    setLoading(true);
    const queryPayload = JSON.stringify({
      query: `
        query GetUserDepositHistory($id: ID!) {
          vaultUser(id: $id) {
            deposits(orderBy: timestamp, orderDirection: desc) {
              timestamp
              amount0
              amount1
              mintedShares
            }
          }
        }
      `,
      variables: { id: userAddress.toLowerCase() }
    });

    fetch(subgraphUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: queryPayload
    })
      .then(res => res.json())
      .then(result => {
        if (result.data && result.data.vaultUser) {
          setDepositHistory(result.data.vaultUser.deposits);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("The Graph endpoint processing exception:", err);
        setLoading(false);
      });
  }, [userAddress, subgraphUrl]);

  return { depositHistory, loading };
}
