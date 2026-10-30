import { createClient } from "genlayer-stable";
import { studionet } from "genlayer-stable/chains";
import { TransactionHashVariant } from "genlayer-stable/types";

const client = createClient({ chain: studionet });
const CONTRACTS = {
  relynx: {
    address: "0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa",
    methods: new Set(["claim_count", "claim_status", "can_rely"]),
  },
  gate: {
    address: "0xe3421601C4F2Fc5cb5b7922cbA98fA0A6B701B0b",
    methods: new Set(["receipt_count", "receipt", "can_act"]),
  },
};
const WITH_ID = new Set(["claim_status", "can_rely", "receipt", "can_act"]);
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({error:"GET only"});
  const { scope, method, id } = req.query || {};
  const c = CONTRACTS[scope];
  if (!c || !c.methods.has(method)) return res.status(400).json({error:"Unsupported read"});
  let args = [];
  if (WITH_ID.has(method)) {
    if (typeof id !== "string" || !/^[1-9]\d{0,5}$/.test(id) || Number(id)>100000)
      return res.status(400).json({error:"Invalid ID"});
    args = [Number(id)];
  } else if (id !== undefined) return res.status(400).json({error:"Unexpected ID"});
  try {
    const result = await client.readContract({address:c.address,functionName:method,args,transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
    const safe = JSON.parse(JSON.stringify(result,(_key,value)=>typeof value==="bigint"?value.toString():value));
    return res.status(200).json({value:safe});
  } catch (error) {
    return res.status(502).json({error: error instanceof Error ? error.message.slice(0,260) : "RPC read failed"});
  }
}
