import { fetch } from 'cross-fetch';

export const API_ENDPOINT = 'http://localhost:3000';

// Mainnet ETH/USDC
export const FEED_ADDRESS = '0xE62B71cf983019BFf55bC83B48601ce8419650CC';

// Fill this in with your deployed aggregator address
export const AGGREGATOR_ADDRESS = '0xA4F8B79A17D2824B4Db50BDa60BCcDA16EDCD8C9';

export async function apiFetch(path: string, options?: RequestInit) {
  const response = await fetch(`${API_ENDPOINT}${path}`, options);
  if (response.status !== 200) {
    console.log('Unavailable API');
    process.exit(1);
  }

  return response;
}

export const ORIGIN_DOMAIN = 80001;
export const DESTINATION_DOMAIN = 5;
