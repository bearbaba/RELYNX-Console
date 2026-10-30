import "./style.css";
import { verifyNoticeReadback } from "./noticeVerification.js";
import { createClient } from "genlayer-stable";
import { studionet } from "genlayer-stable/chains";

const RELYNX = "0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa";
const GATE = "0xe3421601C4F2Fc5cb5b7922cbA98fA0A6B701B0b";
const EXPLORER = "https://explorer-studio.genlayer.com/tx/";
const $ = id => document.getElementById(id);
let wallet = null, account = null, selected = 2, gateClaim = 3, gateAllowed = false;
let locked = false, latestHash = null, refreshToken = 0;
const toObject = v => typeof v === "string" ? JSON.parse(v) : v;
const short = v => typeof v === "string" && v.length > 24 ? v.slice(0,8)+"…"+v.slice(-6) : String(v ?? "—");
const errText = e => e instanceof Error ? e.message : String(e);
function element(tag,text,cls){ const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;}
function pair(container,label,value){container.append(element("dt",label),element("dd",value===undefined||value===null?"—":value));}
function setRead(text,kind=""){ $("readStatus").textContent=text;$("readNotice").className="notice "+kind; }
function tx(title,description,hash=null,state="info",stage="TRANSACTION STATUS") {
 const panel=$("txPanel");panel.hidden=false;panel.dataset.state=state;
 $("txTitle").textContent=title;$("txStatus").textContent=description;$("txStage").textContent=stage;
 $("txSpinner").hidden=state!=="working";
 $("txMark").hidden=state==="working";
 $("txMark").textContent=state==="success"?"✓":state==="error"?"×":state==="unknown"?"!":"i";
 $("txLink").hidden=!hash;
 if(hash)$("txLink").href=EXPLORER+hash;
 $("dismissTx").hidden=state==="working";
 $("checkTx").hidden=state!=="unknown"||!hash;
 $("nextSign").hidden=true;
}
function knownScope(address){return address===RELYNX?"relynx":address===GATE?"gate":null;}
async function read(address,functionName,args=[]) {
 const scope=knownScope(address);
 if (!scope) throw new Error("Unsupported contract address");
 const query=new URLSearchParams({scope,method:functionName});
 if(args.length)query.set("id",String(args[0]));
 const response=await fetch("/api/read?"+query.toString(),{cache:"no-store"});
 let body;
 try{body=await response.json();}catch{throw new Error("Unexpected read service response");}
 if(!response.ok)throw new Error(body?.error||("Read service returned HTTP "+response.status));
 return body.value;
}
function highlightClaim(id){$("preset2").classList.toggle("active",id===2);$("preset3").classList.toggle("active",id===3);$("claimId").value=String(id);}
function setGateChoice(id){
 gateClaim=id;gateAllowed=false;$("actionClaim").value=String(id);
 $("choose2").classList.toggle("active",id===2);$("choose3").classList.toggle("active",id===3);
 $("choose2").setAttribute("aria-pressed",String(id===2));$("choose3").setAttribute("aria-pressed",String(id===3));
 const status=$("eligibility");status.textContent="Claim #"+id+" selected. Check live eligibility before signing.";status.className="eligibility";
 updateSignButton();
}
function updateSignButton(){
 const button=$("signAction");button.disabled=locked||!wallet||!gateAllowed;
 button.textContent=locked?"Transaction in progress…":!wallet?"Connect wallet to sign":!gateAllowed?"Check eligibility first":"Sign & store receipt";
}
async function checkGate(){
 gateAllowed=false;updateSignButton();
 const status=$("eligibility");status.className="eligibility";status.textContent="Checking current on-chain eligibility…";
 const id=gateClaim;
 try {
  const result=await read(GATE,"can_act",[id]);
  if(gateClaim!==id)return;
  gateAllowed=result===true;
  status.className="eligibility "+(gateAllowed?"allowed":"blocked");
  status.textContent=gateAllowed?
   "ALLOWED · Claim #"+id+" is eligible. You can sign an on-chain action.":
   "BLOCKED · Claim #"+id+" cannot be used by this Consumer Gate. No signature needed.";
 }catch(error){
  status.className="eligibility blocked";status.textContent="Cannot verify eligibility: "+errText(error);
 }
 updateSignButton();
}
async function loadClaim(rawId){
 const id=Number(rawId);
 if(!Number.isSafeInteger(id)||id<1){setRead("Enter a valid claim ID.","error");return;}
 selected=id;highlightClaim(id);
 const box=$("claimDetails");box.textContent="Loading Claim #"+id+"…";
 try{
  const results=await Promise.allSettled([
    read(RELYNX,"claim_status",[id]),
    read(GATE,"can_act",[id])
  ]);
  if(results[0].status!=="fulfilled")throw results[0].reason;
  const c=toObject(results[0].value);
  const canAct=results[1].status==="fulfilled"?results[1].value:null;
  box.replaceChildren();
  const head=element("div",undefined,"detail-top");
  head.append(element("strong","Claim #"+id));
  const trusted=c.can_rely===true;
  head.append(element("span",trusted?"RELIABLE":"NOT RELIABLE","pill "+(trusted?"ok":"block")));
  box.append(head);
  const dl=element("dl",undefined,"meta");
  pair(dl,"Statement",c.statement);pair(dl,"Current state",c.state);
  pair(dl,"AI decision",c.last_decision||"Not reviewed");
  pair(dl,"Can rely",trusted?"YES":"NO");
  pair(dl,"Consumer Gate",canAct===null?"Unable to check":canAct===true?"ALLOWED":"BLOCKED");
  pair(dl,"Depends on",[(c.parent_a||null),(c.parent_b||null)].filter(Boolean).map(x=>"#"+x).join(", ")||"Independent");
  pair(dl,"Repository",c.repo);pair(dl,"Issuer",short(c.issuer));pair(dl,"Claim key",c.key);
  box.append(dl);
  const foot=element("div","Live finalized state · RELYNX contract 0x69c3…176Fa","detail-note");box.append(foot);
  if(id===2||id===3){
   const b=$(id===2?"preset2":"preset3");b.classList.toggle("blocked",!trusted);b.classList.toggle("allowed",trusted);
   $(id===2?"state2":"state3").textContent=(canAct===null?"Gate unavailable":canAct?"Gate ALLOWED":"Gate BLOCKED");
  }
 }catch(error){box.replaceChildren(element("div","Unable to load Claim #"+id+": "+errText(error),"eligibility blocked"));}
}
function showReceipt(v){
 const box=$("receiptDetails");box.replaceChildren();
 const d=toObject(v);
 const headline=element("div",undefined,"detail-top");
 headline.append(element("strong","Receipt #"+d.receipt_id),element("span","STORED ON-CHAIN","pill ok"));
 box.append(headline);
 const dl=element("dl",undefined,"meta");
 pair(dl,"Claim", "#"+d.claim_id);pair(dl,"Action",d.action_key);
 pair(dl,"Signer",d.actor);pair(dl,"Receipt ID",d.receipt_id);
 box.append(dl);
}
async function refresh(){
 const token=++refreshToken;
 setRead("Reading latest finalized data from Studionet…");
 const [claims,receipts]=await Promise.allSettled([read(RELYNX,"claim_count"),read(GATE,"receipt_count")]);
 if(token!==refreshToken)return;
 let ok=0;const failures=[];
 if(claims.status==="fulfilled"&&Number.isFinite(Number(claims.value))){
  const n=Number(claims.value);$("claimCount").textContent=String(n);ok++;
 }else{ $("claimCount").textContent="Unavailable"; failures.push("claim counter"); }
 if(receipts.status==="fulfilled"&&Number.isFinite(Number(receipts.value))){
  const n=Number(receipts.value);$("receiptCount").textContent=String(n);ok++;
  if(n>0){
    try{showReceipt(await read(GATE,"receipt",[n]));}
    catch(e){$("receiptDetails").textContent="Receipt #"+n+" could not load: "+errText(e);}
  }else $("receiptDetails").textContent="No stored receipts yet.";
 }else{
  $("receiptCount").textContent="Unavailable";failures.push("receipt counter");
  $("receiptDetails").textContent="Receipt data is unavailable. Use Retry or check the RPC connection.";
 }
 if(token!==refreshToken)return;
 if(ok===2)setRead("Live finalized contract data loaded.","success");
 else setRead("Read problem: "+failures.join(", ")+". Retry or check GenLayer Studio.","error");
 await loadClaim(selected);
}
async function connectWallet(){
 if(wallet){
  wallet=null;account=null;$("walletState").textContent="Read-only mode";$("connectWallet").textContent="Connect wallet";
  gateAllowed=false;$("eligibility").textContent="Disconnected. Check eligibility before signing again.";updateSignButton();
  return;
 }
 const provider=window.ethereum;
 if(!provider){tx("Wallet required","Install or enable an EIP-1193 wallet for signed testnet actions.");return;}
 const button=$("connectWallet");button.disabled=true;button.textContent="Connecting…";
 try {
  const accounts=await provider.request({method:"eth_requestAccounts"});
  if(!accounts?.[0])throw new Error("Wallet did not return an account");
  const expected="0x"+studionet.id.toString(16);
  let current=await provider.request({method:"eth_chainId"});
  if (String(current).toLowerCase()!==expected.toLowerCase()) {
    try {
      await provider.request({method:"wallet_switchEthereumChain",params:[{chainId:expected}]});
    } catch (switchError) {
      if (switchError?.code!==4902) throw switchError;
      await provider.request({method:"wallet_addEthereumChain",params:[{
        chainId:expected,chainName:"GenLayer Studionet",
        rpcUrls:studionet.rpcUrls.default.http,
        nativeCurrency:studionet.nativeCurrency,
        blockExplorerUrls:[studionet.blockExplorers.default.url]
      }]});
      await provider.request({method:"wallet_switchEthereumChain",params:[{chainId:expected}]});
    }
    current=await provider.request({method:"eth_chainId"});
    if(String(current).toLowerCase()!==expected.toLowerCase()) throw new Error("Wallet is not on GenLayer Studionet");
  }
  wallet=createClient({chain:studionet,account:accounts[0],provider});
  account=accounts[0];
  $("walletState").textContent=short(account);button.textContent="Disconnect";
  tx("Wallet connected","Connected as "+short(account)+". GenLayer Studionet · 61999.");
 }catch(error){
  wallet=null;account=null;button.textContent="Connect wallet";
  tx("Wallet connection failed",errText(error));
 }finally{button.disabled=false;updateSignButton();}
}
const TX_STORAGE="relynx.studionet.pending-tx.v2";
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let activePoll=false;
function getPending(){
 try{
  const value=JSON.parse(sessionStorage.getItem(TX_STORAGE)||"null");
  return value&&/^0x[0-9a-fA-F]{64}$/.test(value.hash)&&Array.isArray(value.args)?value:null;
 }catch{return null;}
}
function clearPending(){try{sessionStorage.removeItem(TX_STORAGE);}catch{}}
function savePending(record){try{sessionStorage.setItem(TX_STORAGE,JSON.stringify(record));}catch{}}
async function checkStored(record){
 const [id,key]=record.args;
 if(record.functionName==="perform_action"){
  const n=Number(await read(GATE,"receipt_count"));
  for(let i=n;i>=Math.max(1,n-7);i--){
   const receipt=toObject(await read(GATE,"receipt",[i]));
   if(Number(receipt.claim_id)===Number(id)&&receipt.action_key===key&&
      String(receipt.actor).toLowerCase()===String(record.actor).toLowerCase()){
    return {ok:true,id:i,message:"Receipt #"+i+" is stored on-chain for Claim #"+id+" · "+key+"."};
   }
  }
  return {ok:false,message:"Action receipt not visible yet. Recheck this hash, not a second signature."};
 }
 if(record.functionName==="register_claim"){
  const n=Number(await read(RELYNX,"claim_count"));
  for(let i=n;i>=Math.max(1,n-7);i--){
   const c=toObject(await read(RELYNX,"claim_status",[i]));
   if(c.key===record.args[2]&&c.statement===record.args[3]&&
      String(c.issuer).toLowerCase()===String(record.actor).toLowerCase()){
    return {ok:true,id:i,message:"Claim #"+i+" was registered and verified on-chain."};
   }
  }
  return {ok:false,message:"Registered claim not visible yet. Recheck the existing transaction hash."};
 }
 if(record.functionName==="review_notice"){
  const raw=await read(RELYNX,"claim_status",[id]);
  return verifyNoticeReadback(raw,{claimId:id,digest:record.args[2]});
 }
 return {ok:false,message:"Unknown write method."};
}
async function checkStoredRetry(record){
 let last="Result not yet visible.";
 for(let i=0;i<6;i++){
  try{const result=await checkStored(record);if(result.ok)return result;last=result.message;}
  catch(e){last=errText(e);}
  if(i<5)await sleep(2000);
 }
 return {ok:false,message:last};
}
async function watchPending(record){
 if(activePoll)return;
 activePoll=true;locked=true;latestHash=record.hash;updateSignButton();
 const hash=record.hash;
 try{
  for(let attempt=0;attempt<100;attempt++){
   try{
    const response=await fetch("/api/tx?hash="+encodeURIComponent(hash),{cache:"no-store"});
    const status=await response.json();
    if(!response.ok)throw new Error(status.error||"Status lookup unavailable");
    if(!status.found){
     tx("Transaction submitted","Waiting for transaction to appear on Studionet…",hash,"working","STEP 2 / CONFIRMATION");
    }else{
     const phase=String(status.status||"UNKNOWN").toUpperCase();
     if(phase==="FINALIZED"){
      if(status.execution==="ERROR"){
       clearPending();tx("Transaction failed","FINALIZED · GenVM execution returned an error. No successful action receipt can be claimed.",hash,"error","FINALIZED / ERROR");return;
      }
      if(status.execution==="SUCCESS"){
       tx("Execution confirmed","GenVM reported SUCCESS. Checking the new on-chain record…",hash,"working","STEP 3 / VERIFYING");
       const recordCheck=await checkStoredRetry(record);
       if(recordCheck.ok){
        clearPending();
        tx("Transaction successful",recordCheck.message,hash,"success","FINALIZED / SUCCESS");
        try{
         await refresh();
         if(record.functionName==="register_claim"&&recordCheck.id){
          await loadClaim(recordCheck.id);
          $("gateCustomId").value=String(recordCheck.id);
          setGateChoice(recordCheck.id);
          if($("actionKey").value==="reviewer-demo")$("actionKey").value="relynx-video-"+recordCheck.id+"-01";
          $("claimJourney").hidden=false;
          $("claimJourney").dataset.claimId=String(recordCheck.id);
          $("claimJourneyTitle").textContent="Claim #"+recordCheck.id+" registered successfully";
          $("nextSign").hidden=false;
          document.querySelector("#claimJourney")?.scrollIntoView({behavior:"smooth",block:"center"});
         }else if(record.functionName==="perform_action"){
          await checkGate();
          document.querySelector("#gate")?.scrollIntoView({behavior:"smooth",block:"start"});
         }
        }catch{}
       }else if(record.functionName==="review_notice"){
        tx("FINALIZED · notice NOT verified",recordCheck.message,hash,"unknown","FINALIZED / NOTICE UNVERIFIED");
       }else{
        tx("Finalized · verifying record",recordCheck.message,hash,"unknown","FINALIZED / READBACK PENDING");
       }
       return;
      }
      tx("Finalized · result unverified","Execution details are not yet available. Use the same transaction hash to check again.",hash,"unknown","FINALIZED / CHECK REQUIRED");
      return;
     }
     if(["CANCELED","UNDETERMINED","LEADER_TIMEOUT","VALIDATORS_TIMEOUT"].includes(phase)){
      clearPending();
      tx("Transaction not completed","Network finished with status "+phase+". Check Explorer before trying a new transaction.",hash,"error",phase);
      return;
     }
     const label=phase==="ACCEPTED"?"Consensus accepted. Awaiting finalization…":"GenLayer validators are processing: "+phase.toLowerCase()+".";
     tx("Processing on GenLayer",label,hash,"working","STEP 2 / FINALIZING");
    }
   }catch(e){
    tx("Checking transaction","Status service is temporarily unavailable; still checking your existing hash.",hash,"working","STEP 2 / RETRYING");
   }
   await sleep(3500);
  }
  tx("Still pending","Finality could not be confirmed. Use Check transaction again or Explorer; do not sign a duplicate.",hash,"unknown","STATUS NOT YET CONFIRMED");
 }finally{
  activePoll=false;locked=false;updateSignButton();
 }
}
async function write(address,functionName,args){
 if(locked)return;
 const existing=getPending();
 if(existing){
  tx("Transaction needs verification","A previously submitted hash still needs confirmation. Check it before signing another action.",existing.hash,"unknown","CHECK PREVIOUS TRANSACTION");
  return;
 }
 if(!wallet||!account){tx("Connect wallet first","Connect your Studionet wallet to sign.",null,"error");return;}
 locked=true;latestHash=null;updateSignButton();
 const actor=account;
 try{
  tx("Confirm in wallet","Approve the transaction in your wallet. This is not yet a submitted transaction.",null,"working","STEP 1 / SIGNING");
  const hash=await wallet.writeContract({address,functionName,args,value:0n});
  if(!/^0x[0-9a-fA-F]{64}$/.test(String(hash)))throw new Error("Wallet returned an invalid transaction hash");
  const record={hash:String(hash),functionName,args,actor,address};
  savePending(record);
  tx("Submitted to GenLayer","Wallet signature received. Waiting for consensus and finalization…",hash,"working","STEP 2 / FINALIZING");
  await watchPending(record);
 }catch(e){
  const stored=getPending();
  tx(stored?"Transaction submitted · status unknown":"Transaction not submitted",
     errText(e)+(stored?" Check the existing hash in Explorer; do not sign again.":""),
     stored?.hash??null,stored?"unknown":"error",stored?"CHECK STATUS":"WALLET / SUBMISSION");
 }finally{locked=false;updateSignButton();}
}
$("refresh").onclick=refresh;
$("refreshClaims").onclick=refresh;
$("loadClaim").onclick=()=>loadClaim($("claimId").value);
$("claimId").onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();loadClaim($("claimId").value);}};
$("preset2").onclick=()=>loadClaim(2);
$("preset3").onclick=()=>loadClaim(3);
$("choose2").onclick=()=>setGateChoice(2);
$("choose3").onclick=()=>setGateChoice(3);
$("chooseCustom").onclick=()=>{
 const id=Number($("gateCustomId").value);
 if(!Number.isSafeInteger(id)||id<1){tx("Invalid claim ID","Enter a positive claim ID from the chain.",null,"error");return;}
 setGateChoice(id);
 loadClaim(id);
};
$("connectWallet").onclick=connectWallet;
$("dismissTx").onclick=()=>{if($("txPanel").dataset.state!=="working")$("txPanel").hidden=true;};
$("checkTx").onclick=()=>{const existing=getPending();if(existing&&!locked)watchPending(existing);};
async function continueAfterClaim(){
 const id=Number($("claimJourney").dataset.claimId);
 if(!Number.isSafeInteger(id)||id<1){tx("No new claim selected","Create and finalize a claim first.",null,"error");return;}
 setGateChoice(id);
 $("gateCustomId").value=String(id);
 document.querySelector("#gate")?.scrollIntoView({behavior:"smooth",block:"start"});
 await checkGate();
 if(!gateAllowed){
  $("claimJourney").querySelector("p").textContent="Consumer Gate blocked the new claim. Check the trusted issuer, repository and aurora- claim key policy; do not sign.";
 }
}
$("nextSign").onclick=continueAfterClaim;
$("continueGate").onclick=continueAfterClaim;
$("checkAction").onclick=checkGate;
$("actionForm").onsubmit=async e=>{
 e.preventDefault();
 if(!wallet){tx("Wallet required","Connect your wallet to sign a permitted action.");return;}
 await checkGate();
 if(!gateAllowed){tx("Action blocked","Consumer Gate did not confirm eligibility. No transaction was submitted.");return;}
 const key=$("actionKey").value.trim();
 if(!/^[a-z0-9][a-z0-9_-]{2,39}$/.test(key)){tx("Invalid action reference","Use 3–40 lowercase letters, digits, - or _.");return;}
 await write(GATE,"perform_action",[gateClaim,key]);
};
$("registerForm").onsubmit=e=>{
 e.preventDefault();
 const args=[$("repoOwner").value.trim(),$("repoName").value.trim(),$("claimKey").value.trim(),$("claimStatement").value.trim(),Number($("parentA").value),Number($("parentB").value)];
 if(args[3].length<32){tx("Invalid claim","Statement must be at least 32 characters.",null,"error");return;}
 if(args[0]!=="bearbaba"||args[1]!=="relynx"||!args[2].startsWith("aurora-")){
  tx("Consumer Gate demo policy mismatch","For the complete sign-and-receipt demo, use bearbaba / relynx and a Claim Key starting with aurora-. Nothing has been sent.",null,"error");
  return;
 }
 const trustedIssuer="0x4C7cb73aC8F8999af21cfc9fF4cF2333a9508Dcb";
 if(account&&account.toLowerCase()!==trustedIssuer.toLowerCase()){
  tx("Different issuer wallet","The current Consumer Gate trusts a different issuer wallet. Switch to the existing demo issuer to create a claim eligible for a follow-up action.",null,"error");
  return;
 }
 $("claimJourney").hidden=true;
 write(RELYNX,"register_claim",args);
};
$("noticeForm").onsubmit=e=>{
 e.preventDefault();
 const commit=$("noticeCommit").value.trim(),digest=$("noticeDigest").value.trim();
 if(!/^[0-9a-f]{40}$/.test(commit)||!/^[0-9a-f]{64}$/.test(digest)){tx("Invalid notice","Use the full lowercase commit SHA and exact SHA-256 digest.");return;}
 if(!window.confirm("This GenLayer review can permanently revoke a claim. Submit the notice?"))return;
 write(RELYNX,"review_notice",[Number($("noticeClaim").value),commit,digest]);
};
window.ethereum?.on?.("accountsChanged",()=>{wallet=null;account=null;gateAllowed=false;$("walletState").textContent="Wallet changed · reconnect";$("connectWallet").textContent="Connect wallet";updateSignButton();});
window.ethereum?.on?.("chainChanged",()=>{wallet=null;account=null;gateAllowed=false;$("walletState").textContent="Network changed · reconnect";$("connectWallet").textContent="Connect wallet";updateSignButton();});
setGateChoice(3);
refresh().then(()=>checkGate());
const pendingOnLoad=getPending();
if(pendingOnLoad){tx("Resuming transaction","Rechecking the submitted hash after page reload…",pendingOnLoad.hash,"working","STEP 2 / FINALIZING");watchPending(pendingOnLoad);}
