import { Address } from 'viem';

export type EtherscanSuccess<T> = {
  status: '1';
  message: 'OK';
  result: T;
};

export type EtherscanError = {
  status: '0';
  message: string;
  result: null;
};

export function isEtherscanError<T>(
  x: EtherscanSuccess<T> | EtherscanError,
): x is EtherscanError {
  return x.status === '0';
}

export type Log = {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  timeStamp: string;
  gasPrice: string;
  gasUsed: string;
  logIndex: string;
  transactionHash: Address;
  transactionIndex: string;
};

export type Account = {
  blockNumber: string;
  timeStamp: string;
  hash: Address;
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
};

export interface AccountTransactionsError {
  status: '0';
  message: string;
  result: null;
}
