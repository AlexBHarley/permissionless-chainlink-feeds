import { fetch } from "cross-fetch";

export const API_ENDPOINT = "http://localhost:3000/api";

export const ORIGIN_DOMAIN = 5;
export const DESTINATION_DOMAIN = 80001;

// Goerli ETH/USDC
export const FEED_ADDRESS = "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e";

// Fill this in with your deployed aggregator address
export const AGGREGATOR_ADDRESS = "0xeb1cdce0a7e57a2255e663afa059bfb8e742ab1c";

export async function apiFetch(path: string, options?: RequestInit) {
  const response = await fetch(`${API_ENDPOINT}${path}`, options);
  if (response.status !== 200) {
    console.log("Unavailable API");
    process.exit(1);
  }

  return response;
}
