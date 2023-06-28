import type { NextApiRequest, NextApiResponse } from "next";
import { utils } from "@hyperlane-xyz/utils";
import { EtherscanService } from "./_shared";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { chainId, feed } = req.query;
  const { data: message } = req.body;

  const { body: roundId } = utils.parseMessage(message);

  return res.json(
    await new EtherscanService().getRoundData(
      parseInt(chainId as string),
      feed as string,
      parseInt(roundId as string)
    )
  );
}
