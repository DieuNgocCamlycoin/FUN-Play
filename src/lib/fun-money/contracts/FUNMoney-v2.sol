// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * FUN Money — Constitution 2.0 (Executable Soul)
 * BEP-20 compatible (ERC-20 standard) with:
 * - 4 Pools mapping
 * - Token state machine (Locked / Activated / Flowing / Recycle)
 * - Recycle timer (auto-return to Community Pool on inactivity)
 * - Guardian role + on-chain timelock
 * - Event log "Pure Love Proof"
 *
 * NOTES (very important):
 * 1) "Auto-return" is enforced at protocol level by allowing the contract to recycle inactive balances
 *    back to Community Pool. This is the on-chain version of "FUN cannot sleep".
 * 2) PPLP is enforced via signed attestations (AI/Platform Guardian signatures) + on-chain allowlist.
 * 3) This is a solid v1 implementation skeleton. Before mainnet: audit + test suite + multisig Guardian.
 *
 * STATUS: Partial — received from CamLy Duong (Constitution Author)
 * MISSING: Pool mappings, State Machine, Recycle Timer, Guardian Timelock (to be sent)
 */

// ------------------------- Minimal ECDSA -------------------------
library ECDSA {
    function toEthSignedMessageHash(bytes32 h) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", h));
    }

    function recover(bytes32 ethSignedHash, bytes memory sig) internal pure returns (address) {
        require(sig.length == 65, "SIG_LEN");
        bytes32 r; bytes32 s; uint8 v;
        assembly {
            r := mload(add(sig, 0x20))
            s := mload(add(sig, 0x40))
            v := byte(0, mload(add(sig, 0x60)))
        }
        if (v < 27) v += 27;
        require(v == 27 || v == 28, "SIG_V");
        address signer = ecrecover(ethSignedHash, v, r, s);
        require(signer != address(0), "SIG_RECOVER");
        return signer;
    }
}

// ------------------------- Minimal ERC20 (BEP-20 compatible) -------------------------
abstract contract ERC20 {
    string public name;
    string public symbol;
    uint8  public immutable decimals = 18;

    uint256 public totalSupply;

    mapping(address => uint256) internal _bal;
    mapping(address => mapping(address => uint256)) internal _allow;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory n, string memory s) {
        name = n;
        symbol = s;
    }

    function balanceOf(address a) public view returns (uint256) { return _bal[a]; }
    function allowance(address o, address sp) public view returns (uint256) { return _allow[o][sp]; }

    function approve(address sp, uint256 amt) public returns (bool) {
        _allow[msg.sender][sp] = amt;
        emit Approval(msg.sender, sp, amt);
        return true;
    }

    function transfer(address to, uint256 amt) public virtual returns (bool) {
        _transfer(msg.sender, to, amt);
        return true;
    }

    function transferFrom(address from, address to, uint256 amt) public virtual returns (bool) {
        uint256 a = _allow[from][msg.sender];
        require(a >= amt, "ALLOW");
        unchecked { _allow[from][msg.sender] = a - amt; }
        _transfer(from, to, amt);
        return true;
    }

    function _transfer(address from, address to, uint256 amt) internal virtual {
        require(to != address(0), "TO_0");
        uint256 b = _bal[from];
        require(b >= amt, "BAL");
        unchecked { _bal[from] = b - amt; }
        _bal[to] += amt;
        emit Transfer(from, to, amt);
    }

    function _mint(address to, uint256 amt) internal {
        require(to != address(0), "MINT_TO_0");
        totalSupply += amt;
        _bal[to] += amt;
        emit Transfer(address(0), to, amt);
    }
}

// ------------------------- FUN Money Contract -------------------------
contract FUNMoney is ERC20 {
    using ECDSA for bytes32;

    // ====== Pools (4 Pool Structure — Constitution v2.0, Chương VI) ======
    // TODO: Awaiting remaining code from Constitution Author
    // Expected:
    //   - address public communityPool;       // 40% — trái tim của FUN Money
    //   - address public platformPool;        // 30% — kích hoạt dịch vụ
    //   - address public recyclePool;         // 20% — thu hồi FUN không còn dòng chảy
    //   - address public guardianPool;        // 10% — giữ Luật, ổn định hệ thống
    //   - NO Team Pool, NO Investor Pool (❌ FORBIDDEN)

    // ====== Token State Machine (Chương IV) ======
    // Expected states: LOCKED → ACTIVATED → FLOWING → RECYCLE
    // "FUN Money không burn – không tiêu hủy. Mọi FUN chỉ đổi trạng thái và nơi cư trú."

    // ====== Recycle Timer (Chương V — Anti-Hoarding Law) ======
    // Expected: 90-day grace period, 0.1%/day decay, max 50% total
    // "FUN không sinh ra để ngủ yên. FUN sinh ra để chảy như Ánh Sáng."

    // ====== Guardian Role + Time-lock (Chương VII-VIII) ======
    // Expected: Guardian of Flow — Người Gác Dòng Chảy
    // AI Agent: observe, validate PPLP, allow flow, reclaim when off-Law
    // All Guardian actions time-locked & transparent on-chain

    // ====== Event log "Pure Love Proof" ======
    // event PureLoveAccepted(address indexed user, bytes32 indexed action, uint256 amount, uint32 version);

    constructor() ERC20("FUN Money", "FUN") {
        // Constructor will be completed with pool initialization
    }
}
