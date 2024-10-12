const fs = require("fs");
const path = require("path");

const backendArtifactsDir = "./artifacts/contracts";
const frontendAbisDir = "../frontend/src/abis";

const copyAbiFilesToFrontend = () => {
  // Create the ABI directory in the frontend project if it doesn't exist
  if (!fs.existsSync(frontendAbisDir)) {
    fs.mkdirSync(frontendAbisDir, { recursive: true });
  }

  // Iterate through the ABI files in the backend artifacts directory
  fs.readdirSync(backendArtifactsDir).forEach((contractFolder) => {
    const contractDir = path.join(backendArtifactsDir, contractFolder);

    // Check if it's a directory
    if (fs.statSync(contractDir).isDirectory()) {
      const abiFiles = fs
        .readdirSync(contractDir)
        .filter(
          (file) => file.endsWith(".json") && !file.endsWith(".dbg.json"),
        );

      // Copy each ABI file to the frontend ABI directory
      abiFiles.forEach((abiFile) => {
        const srcPath = path.join(contractDir, abiFile);
        const destPath = path.join(frontendAbisDir, abiFile);

        // Read the ABI from the JSON file
        const jsonContent = JSON.parse(fs.readFileSync(srcPath));
        const abi = jsonContent.abi;

        // Write the ABI to the frontend directory
        fs.writeFileSync(destPath, JSON.stringify(abi, null, 2));
        console.log(`Copied ABI: ${abiFile}`);
      });
    }
  });

  console.log("ABI files copied to the frontend directory.");
};

copyAbiFilesToFrontend();
