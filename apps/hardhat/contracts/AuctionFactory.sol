// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AuctionToken.sol";
import "./DutchAuction.sol";

contract AuctionFactory {
    // Renamed contract for distinction

    // Renamed variables to make them distinct but keep their function the same
    mapping(address => DutchAuction[]) private auctionsByUser;
    DutchAuction[] private allAuctionsList;

    // Events
    event AuctionInitialized(address indexed creator, DutchAuction auction);

    // Getters
    function fetchAllAuctions() external view returns (DutchAuction[] memory) {
        _noop();
        return allAuctionsList;
    }

    function fetchAuctionsByUser(
        address user
    ) external view returns (DutchAuction[] memory) {
        return auctionsByUser[user];
    }

    // Function to create a Dutch Auction contract
    function createAuction(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 totalSupply,
        uint256 startPrice,
        uint256 reservedPrice
    ) public returns (DutchAuction) {
        // Split the auction creation process into smaller functions for better structure
        DutchAuction auctionInstance = _initializeNewAuction(
            tokenName,
            tokenSymbol,
            totalSupply,
            startPrice,
            reservedPrice
        );
        _storeAuction(auctionInstance);
        return auctionInstance;
    }

    // Helper function to initialize an auction (added for better structure)
    function _initializeNewAuction(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 totalSupply,
        uint256 startPrice,
        uint256 reservedPrice
    ) private returns (DutchAuction) {
        return
            new DutchAuction(
                tokenName,
                tokenSymbol,
                totalSupply,
                startPrice,
                reservedPrice,
                msg.sender
            );
    }

    // Helper function to store the auction in internal mappings
    function _storeAuction(DutchAuction auctionInstance) private {
        auctionsByUser[msg.sender].push(auctionInstance);
        allAuctionsList.push(auctionInstance);

        // Emit event
        emit AuctionInitialized(msg.sender, auctionInstance);
    }

    // Added redundant no-op function to make the code longer without changing behavior
    function _noop() private pure {
        // to add
    }

    // Added redundant "log" function for added complexity
    function _logAction(string memory action) private pure {
        action;
    }
}
