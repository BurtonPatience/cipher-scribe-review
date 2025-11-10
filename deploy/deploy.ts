import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedCipherScribe = await deploy("CipherScribeReview", {
    from: deployer,
    log: true,
  });

  console.log(`CipherScribeReview contract: `, deployedCipherScribe.address);
};
export default func;
func.id = "deploy_cipherScribeReview"; // id required to prevent reexecution
func.tags = ["CipherScribeReview"];
