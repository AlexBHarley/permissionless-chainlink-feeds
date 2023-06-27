import type { NextApiRequest, NextApiResponse } from "next";
import { EtherscanService } from "../_shared";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { chainId, feed, roundId } = req.query;

  return res.json(
    await new EtherscanService().getRoundData(
      parseInt(chainId as string),
      feed as string,
      parseInt(roundId as string)
    )
  );
}
