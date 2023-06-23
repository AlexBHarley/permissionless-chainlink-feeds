import { Address } from 'viem';

export interface AccountTransactionsResponse {
  status: '1';
  message: 'OK';
  result: {
    blockNumber: string;
    timeStamp: string;
    hash: string;
    nonce: string;
    blockHash: string;
    transactionIndex: string;
    from: string;
    to: string;
    value: string;
    gas: string;
    gasPrice: string;
    isError: string;
    txreceipt_status: string;
    input: Address;
    contractAddress: string;
    cumulativeGasUsed: string;
    gasUsed: string;
    confirmations: string;
    methodId: string;
    functionName: string;
  }[];
}

export interface AccountTransactionsError {
  status: '0';
  message: string;
  result: null;
}
