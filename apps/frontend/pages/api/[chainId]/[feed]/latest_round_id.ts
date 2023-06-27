import type { NextApiRequest, NextApiResponse } from "next";
import { EtherscanService } from "./_shared";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { chainId, feed } = req.query;

  return res.json(
    await new EtherscanService().getLatestRoundId(
      parseInt(chainId as string),
      feed as string
    )
  );
}
