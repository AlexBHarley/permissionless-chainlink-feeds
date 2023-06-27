const mapping = {
  1: buildLogo("ethereum", "eth"),
  56: buildLogo("bnb", "bnb"),
  137: buildLogo("polygon", "matic"),
};

function buildLogo(network: string, token: string) {
  return `https://cryptologos.cc/logos/${network}-${token}-logo.png`;
}

export function networkLogo() {}
