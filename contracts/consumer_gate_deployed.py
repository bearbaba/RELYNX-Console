# v0.1.0
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""RELYNX Consumer Gate V1 — action receipts bound to live trust.

This is a separately deployed consumer of an existing RELYNX Intelligent
Contract, not a modification to RELYNX. An accepted action creates a persistent
receipt only when the registered claim is still eligible AND matches the
consumer's immutable issuer, repository, key prefix, and chain policy.

Demo-only action receipts; no funds, asset transfers, or real-world credentials.
"""
from genlayer import *
from dataclasses import dataclass
import json
import re

MAX_ACTIONS = 100


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise gl.vm.UserError(reason)


def valid_repo(repo: str) -> bool:
    if type(repo) is not str or len(repo) > 125 or repo.count("/") != 1:
        return False
    owner, name = repo.split("/")
    return (re.fullmatch(r"[a-z0-9][a-z0-9-]{0,38}", owner) is not None
            and re.fullmatch(r"[a-z0-9_.-]{1,75}", name) is not None
            and name not in (".", "..") and ".." not in name)


def canonical(data) -> str:
    return json.dumps(data, sort_keys=True, separators=(",", ":"))


def as_address(value) -> Address:
    """Convert Studio u160 integer inputs into GenLayer Address."""
    if isinstance(value, Address):
        return value
    if type(value) is int:
        require(0 <= value < (1 << 160), "invalid 160-bit address")
        return Address("0x" + format(value, "040x"))
    require(type(value) is str and
            re.fullmatch(r"0x[0-9a-fA-F]{40}", value) is not None,
            "invalid address")
    return Address(value)


@allow_storage
@dataclass
class ActionReceipt:
    claim_id: u256
    actor: Address
    action_key: str


class RelynxConsumerGate(gl.Contract):
    relynx: Address
    issuer: Address
    repository: str
    key_prefix: str
    chain_id: str
    next_receipt_id: u256
    receipts: TreeMap[u256, ActionReceipt]

    def __init__(self, relynx: Address, issuer: Address,
                 repository: str, key_prefix: str):
        # Studio decodes Address parameters, while DirectVM often supplies
        # raw hexadecimal strings. Normalize before writing Address storage.
        source = as_address(relynx)
        trusted = as_address(issuer)
        zero = Address("0x" + "0" * 40)
        require(source != zero and trusted != zero, "zero trusted address")
        require(source != trusted, "invalid contract address")
        require(valid_repo(repository), "invalid trusted repository")
        require(type(key_prefix) is str and
                re.fullmatch(r"[a-z0-9][a-z0-9_-]{1,30}", key_prefix) is not None,
                "invalid key prefix")
        self.relynx = source
        self.issuer = trusted
        self.repository = repository
        self.key_prefix = key_prefix
        self.chain_id = str(gl.message.chain_id)
        self.next_receipt_id = u256(1)

    def _is_eligible(self, claim_id: int) -> bool:
        if type(claim_id) is not int or claim_id < 1:
            return False
        source = gl.get_contract_at(self.relynx)
        raw = source.view().claim_status(claim_id)
        if type(raw) is not str or len(raw) > 4096:
            return False
        info = json.loads(raw)
        if type(info) is not dict:
            return False
        if (info.get("claim_id") != claim_id or
                info.get("chain_id") != self.chain_id or
                info.get("state") != "ACTIVE" or
                info.get("repo") != self.repository):
            return False
        issuer = info.get("issuer")
        key = info.get("key")
        if (type(issuer) is not str or
                issuer.lower() != self.issuer.as_hex.lower() or
                type(key) is not str or
                not key.startswith(self.key_prefix)):
            return False
        # Never trust the child's ACTIVE field alone: RELYNX may report
        # ACTIVE while an ancestor has been revoked.
        if info.get("can_rely") is not True:
            return False
        return source.view().can_rely(claim_id) is True

    @gl.public.view
    def can_act(self, claim_id: int) -> bool:
        try:
            return self._is_eligible(claim_id)
        except Exception:
            # Fail closed on unavailable/malformed/unregistered sources.
            return False

    @gl.public.write
    def perform_action(self, claim_id: int, action_key: str) -> int:
        require(type(action_key) is str and
                re.fullmatch(r"[a-z0-9][a-z0-9_-]{2,39}", action_key) is not None,
                "invalid action key")
        require(int(self.next_receipt_id) <= MAX_ACTIONS, "action capacity reached")
        require(self.can_act(claim_id), "claim not eligible")
        idx = int(self.next_receipt_id)
        self.receipts[u256(idx)] = ActionReceipt(
            claim_id=u256(claim_id),
            actor=gl.message.sender_address,
            action_key=action_key,
        )
        self.next_receipt_id = u256(idx + 1)
        return idx

    @gl.public.view
    def receipt_count(self) -> int:
        return int(self.next_receipt_id) - 1

    @gl.public.view
    def receipt(self, receipt_id: int) -> str:
        require(type(receipt_id) is int and
                1 <= receipt_id < int(self.next_receipt_id), "unknown receipt")
        r = self.receipts[u256(receipt_id)]
        return canonical({"receipt_id": receipt_id, "claim_id": int(r.claim_id),
                          "actor": r.actor.as_hex, "action_key": r.action_key})

    @gl.public.view
    def policy(self) -> str:
        return canonical({"relynx": self.relynx.as_hex,
                          "issuer": self.issuer.as_hex,
                          "repository": self.repository,
                          "key_prefix": self.key_prefix,
                          "chain_id": self.chain_id})