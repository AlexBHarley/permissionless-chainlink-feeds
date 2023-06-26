import { fetch } from "cross-fetch";

export const API_ENDPOINT = "http://localhost:3000";

export const ORIGIN_DOMAIN = 5;
export const DESTINATION_DOMAIN = 80001;

// Goerli ETH/USDC
export const FEED_ADDRESS = "0x9b0FC4bb9981e5333689d69BdBF66351B9861E62";

// Fill this in with your deployed aggregator address
export const AGGREGATOR_ADDRESS = "0xa3D13a76A1180aAE135472560E53011DE9670185";

export async function apiFetch(path: string, options?: RequestInit) {
  const response = await fetch(`${API_ENDPOINT}${path}`, options);
  if (response.status !== 200) {
    console.log("Unavailable API");
    process.exit(1);
  }

  return response;
}
