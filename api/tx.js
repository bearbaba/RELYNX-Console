import { createClient } from "genlayer-stable";
import { studionet } from "genlayer-stable/chains";

const client=createClient({chain:studionet});
const HASH=/^0x[0-9a-fA-F]{64}$/;

export default async function handler(req,res) {
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="GET")return res.status(405).json({error:"GET only"});
 const hash=req.query?.hash;
 if(typeof hash!=="string"||!HASH.test(hash))return res.status(400).json({error:"Invalid transaction hash"});
 try{
  const t=await client.getTransaction({hash});
  if(!t)return res.status(200).json({found:false});
  const status=String(t.statusName??t.status_name??t.status??"UNKNOWN");
  const consensus=t.consensus_data??t.consensusData??{};
  const leader=consensus.leader_receipt??consensus.leaderReceipt??null;
  const outcomes=(Array.isArray(leader)?leader:[leader]).filter(Boolean)
   .map(x=>String(x.execution_result??x.executionResult??"UNKNOWN").toUpperCase());
  let execution="UNKNOWN";
  const explicit=t.txExecutionResultName;
  if(explicit==="FINISHED_WITH_RETURN")execution="SUCCESS";
  else if(explicit==="FINISHED_WITH_ERROR")execution="ERROR";
  else if(outcomes.length && outcomes.every(x=>x==="SUCCESS"))execution="SUCCESS";
  else if(outcomes.some(x=>x==="ERROR"||x==="FAILURE"||x==="FINISHED_WITH_ERROR"))execution="ERROR";
  return res.status(200).json({found:true,status,execution,executionSource:explicit?"transaction":"consensus_leader_receipt"});
 }catch(e){return res.status(502).json({error:e instanceof Error?e.message.slice(0,200):"Transaction status unavailable"});}
}