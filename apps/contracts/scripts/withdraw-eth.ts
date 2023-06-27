import hre from "hardhat";

async function main() {
  const a = await hre.ethers.getContractAt(
    "GelatoAutomate",
    "0x35531c8056286FC96b4e36E2016F1d22006EF151"
  );

  try {
    const b = await a.withdrawETH();
    console.log(await b.wait());
  } catch (e) {
    console.log(e);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
