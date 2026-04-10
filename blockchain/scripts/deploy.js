import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy LandRegistry
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const registry = await LandRegistry.deploy();
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log("LandRegistry deployed to:", contractAddress);

  // Save contract address & ABI for the frontend
  const artifactsDir = path.join(__dirname, "..", "..", "frontend", "src", "artifacts");
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  // Save address
  const addressFile = path.join(artifactsDir, "contract-address.json");
  fs.writeFileSync(addressFile, JSON.stringify({ address: contractAddress }, null, 2));
  console.log("Contract address saved to:", addressFile);

  // Copy ABI
  const artifact = await hre.artifacts.readArtifact("LandRegistry");
  const abiFile = path.join(artifactsDir, "LandRegistry.json");
  fs.writeFileSync(abiFile, JSON.stringify(artifact, null, 2));
  console.log("ABI saved to:", abiFile);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
