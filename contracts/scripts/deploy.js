const hre = require("hardhat");

async function main() {
  const networkName = hre.network.name;
  const chainId = hre.network.config.chainId;

  console.log("🚀 Deploying CeloPredict to", networkName, "...\n");
  console.log("📡 Chain ID:", chainId);
  console.log("⏳ Please wait...\n");

  // Get the contract factory
  const CeloPredict = await hre.ethers.getContractFactory("CeloPredict");

  // Deploy with gas limit
  const celoPredict = await CeloPredict.deploy({
    gasLimit: 5000000,
  });

  await celoPredict.waitForDeployment();
  const address = await celoPredict.getAddress();

  // Determine the correct explorer URL based on network
  let explorerUrl = `https://celoscan.io/address/${address}`;

  console.log("✅ CeloPredict deployed successfully!");
  console.log("📋 Contract Address:", address);
  console.log("🔗 Explorer:", explorerUrl);
  console.log("\n⚠️  SAVE THIS ADDRESS FOR YOUR FRONTEND!\n");

  // Wait for block confirmations
  console.log("⏳ Waiting for 5 block confirmations...");
  await celoPredict.deploymentTransaction().wait(5);
  console.log("✅ Confirmed!\n");

  // Create sample matches
  console.log("🎮 Creating sample match...");
  const now = Math.floor(Date.now() / 1000);
  const oneDay = 86400;

  try {
    const tx1 = await celoPredict.createMatch(
      "Arsenal",
      "Chelsea",
      now + oneDay,
      { gasLimit: 500000 }
    );
    await tx1.wait();
    console.log("✅ Match 1: Arsenal vs Chelsea");

    console.log("\n🎉 Deployment complete!\n");
  } catch (error) {
    console.log("⚠️  Could not create sample match:", error.message);
    console.log("You can create it manually later.\n");
  }

  // Verify contract (optional)
  if (process.env.CELOSCAN_API_KEY) {
    console.log("🔍 Verifying contract...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [],
      });
      console.log("✅ Contract verified!");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
      console.log("You can verify manually at:", explorerUrl);
    }
  }

  console.log("\n📝 Next Steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Add it to your frontend .env.local:");
  console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
  console.log(`   NEXT_PUBLIC_CHAIN_ID=${chainId}`);
  console.log(`   NEXT_PUBLIC_CELO_RPC_URL=https://forno.celo.org`);
  console.log(
    "3. Copy the ABI from artifacts/contracts/CeloPredict.sol/CeloPredict.json"
  );
  console.log("4. Test on the blockchain explorer\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
