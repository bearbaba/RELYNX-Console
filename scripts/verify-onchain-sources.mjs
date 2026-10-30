import { createClient } from "genlayer-stable";
import { studionet } from "genlayer-stable/chains";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const sources = [
  {
    label: "RELYNX",
    address: "0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa",
    file: new URL("../contracts/relynx_deployed.py", import.meta.url),
    expectedSha256: "15074c886bee129af732c4ddf25a55ffe8199e65569857da0738501c5681fc17",
  },
  {
    label: "Consumer Gate",
    address: "0xe3421601C4F2Fc5cb5b7922cbA98fA0A6B701B0b",
    file: new URL("../contracts/consumer_gate_deployed.py", import.meta.url),
    expectedSha256: "733e88b435119fb12aead71f2bf5b6e1d68258debed5a58e67dfcf0c4cd33674",
  },
];

const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const client = createClient({ chain: studionet });

let failed = false;
for (const source of sources) {
  try {
    const local = await readFile(source.file);
    const deployedCode = await client.getContractCode(source.address);
    const deployed = Buffer.from(deployedCode, "utf8");
    const onchainDigest = hash(deployed), localDigest = hash(local);
    const match = local.equals(deployed) && onchainDigest === source.expectedSha256;
    console.log(JSON.stringify({
      label: source.label,
      address: source.address,
      chainId: 61999,
      bytes: local.length,
      localSha256: localDigest,
      deployedSha256: onchainDigest,
      exactBytesMatch: match,
    }, null, 2));
    if (!match) failed = true;
  } catch (error) {
    failed = true;
    console.error(source.label + " verification unavailable: " + String(error?.message || error));
  }
}
if (failed) process.exitCode = 1;
