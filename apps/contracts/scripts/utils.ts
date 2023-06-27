import { fetch } from "cross-fetch";

export const API_ENDPOINT = "http://localhost:3000";

export const ORIGIN_DOMAIN = 5;
export const DESTINATION_DOMAIN = 80001;

// Goerli ETH/USDC
export const FEED_ADDRESS = "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e";

// Fill this in with your deployed aggregator address
export const AGGREGATOR_ADDRESS = "0x46F5d5E866B3ac5c8fF099568fD9c5e69e01F1d6";

export async function apiFetch(path: string, options?: RequestInit) {
  const response = await fetch(`${API_ENDPOINT}${path}`, options);
  if (response.status !== 200) {
    console.log("Unavailable API");
    process.exit(1);
  }

  return response;
}
