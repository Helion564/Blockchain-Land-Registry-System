// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title LandRegistry
 * @notice Blockchain-based land registry allowing an admin (government officer)
 *         to add land records and transfer ownership. Citizens can view records.
 */
contract LandRegistry {
    // ───────────── State ─────────────
    address public admin;
    uint256 public landCount;

    struct Land {
        uint256  id;
        string   ownerName;
        address  ownerWallet;
        string   location;      // text or "lat,lng"
        string   landType;      // Agricultural, Residential, Commercial, etc.
        uint256  price;         // in Wei
        uint256  timestamp;
        bool     exists;
    }

    mapping(uint256 => Land) public lands;       // landId => Land
    mapping(address => uint256[]) public ownerLands; // wallet => landIds

    // ───────────── Events ─────────────
    event LandAdded(
        uint256 indexed id,
        string  ownerName,
        address indexed ownerWallet,
        string  location,
        string  landType,
        uint256 price,
        uint256 timestamp
    );

    event OwnershipTransferred(
        uint256 indexed id,
        address indexed previousOwner,
        address indexed newOwner,
        string  newOwnerName,
        uint256 timestamp
    );

    // ───────────── Modifiers ─────────────
    modifier onlyAdmin() {
        require(msg.sender == admin, "LandRegistry: caller is not admin");
        _;
    }

    modifier landExists(uint256 _id) {
        require(lands[_id].exists, "LandRegistry: land does not exist");
        _;
    }

    // ───────────── Constructor ─────────────
    constructor() {
        admin = msg.sender;
        landCount = 0;
    }

    // ───────────── Admin Functions ─────────────

    /**
     * @notice Add a new land record to the registry.
     */
    function addLand(
        string memory _ownerName,
        address       _ownerWallet,
        string memory _location,
        string memory _landType,
        uint256       _price
    ) external onlyAdmin {
        landCount++;
        uint256 newId = landCount;

        lands[newId] = Land({
            id:          newId,
            ownerName:   _ownerName,
            ownerWallet: _ownerWallet,
            location:    _location,
            landType:    _landType,
            price:       _price,
            timestamp:   block.timestamp,
            exists:      true
        });

        ownerLands[_ownerWallet].push(newId);

        emit LandAdded(
            newId,
            _ownerName,
            _ownerWallet,
            _location,
            _landType,
            _price,
            block.timestamp
        );
    }

    /**
     * @notice Transfer land ownership to a new address.
     */
    function transferOwnership(
        uint256       _landId,
        address       _newOwner,
        string memory _newOwnerName
    ) external onlyAdmin landExists(_landId) {
        Land storage land = lands[_landId];
        address previousOwner = land.ownerWallet;

        require(_newOwner != address(0), "LandRegistry: invalid new owner");
        require(_newOwner != previousOwner, "LandRegistry: same owner");

        // Remove land from previous owner's list
        _removeFromOwnerList(previousOwner, _landId);

        // Update record
        land.ownerName   = _newOwnerName;
        land.ownerWallet = _newOwner;
        land.timestamp   = block.timestamp;

        ownerLands[_newOwner].push(_landId);

        emit OwnershipTransferred(
            _landId,
            previousOwner,
            _newOwner,
            _newOwnerName,
            block.timestamp
        );
    }

    // ───────────── View Functions (Citizens) ─────────────

    /**
     * @notice Get land details by ID.
     */
    function getLand(uint256 _id)
        external
        view
        landExists(_id)
        returns (
            uint256  id,
            string memory ownerName,
            address  ownerWallet,
            string memory location,
            string memory landType,
            uint256  price,
            uint256  timestamp
        )
    {
        Land storage l = lands[_id];
        return (l.id, l.ownerName, l.ownerWallet, l.location, l.landType, l.price, l.timestamp);
    }

    /**
     * @notice Get all land IDs owned by a wallet address.
     */
    function getLandsByOwner(address _owner) external view returns (uint256[] memory) {
        return ownerLands[_owner];
    }

    /**
     * @notice Get all lands (paginated).
     */
    function getAllLands(uint256 _start, uint256 _count)
        external
        view
        returns (Land[] memory)
    {
        uint256 end = _start + _count;
        if (end > landCount) {
            end = landCount;
        }
        uint256 resultCount = end >= _start ? end - _start : 0;
        Land[] memory result = new Land[](resultCount);

        for (uint256 i = 0; i < resultCount; i++) {
            uint256 landId = _start + i + 1; // 1-indexed
            if (lands[landId].exists) {
                result[i] = lands[landId];
            }
        }
        return result;
    }

    // ───────────── Internal Helpers ─────────────

    function _removeFromOwnerList(address _owner, uint256 _landId) internal {
        uint256[] storage list = ownerLands[_owner];
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == _landId) {
                list[i] = list[list.length - 1];
                list.pop();
                break;
            }
        }
    }
}
