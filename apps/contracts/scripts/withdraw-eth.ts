import hre from "hardhat";

async function main() {
  const a = await hre.ethers.getContractAt(
    "GelatoAutomate",
    "0xf19c411808288e78bb7c7dec2b782217b0666838"
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
