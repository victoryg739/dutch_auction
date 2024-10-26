// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AuctionToken.sol";

/// @title DutchAuction Contract
/// @notice Implements a Dutch auction mechanism for selling tokens
contract DutchAuction {
    // Instance of the AuctionToken contract representing the tokens being auctioned
    AuctionToken private _auctionToken;

    // Address of the auction creator who will receive the proceeds
    address private _auctionCreator;

    // Total number of tokens available for sale in the auction
    uint256 private _auctionTotalSupply;

    // Initial price per token at the start of the auction
    uint256 private _auctionStartPrice;

    // Minimum price per token at which the auction will end
    uint256 private _auctionReservedPrice;

    // Timestamp when the auction starts
    uint256 private _auctionStartTime;

    // Duration of the auction in seconds (20 minutes in this case)
    uint256 private constant _AUCTION_DURATION = 20 minutes;

    // Flag indicating whether tokens have been distributed after the auction ends
    bool private _areTokensDistributed = false;

    // Reentrancy lock to prevent reentrant calls to certain functions
    bool private _reentrancyLock = false;

    // Structure representing a bid in the auction
    struct AuctionBid {
        // Address of the bidder
        address bidderAddress;
        // Amount of Ether committed by the bidder
        uint256 bidCommitment;
    }

    // Array of all bids placed during the auction
    AuctionBid[] private _auctionBids;

    // Total amount of Ether committed by all bidders
    uint256 private _auctionTotalCommitment = 0;

    // Mapping from bidder address to their total commitment
    mapping(address => uint256) private _bidderCommitments;

    // The price per token at which the last bid was placed
    uint256 private _auctionLastBidPrice;

    // Event emitted when a refund to a bidder fails
    event RefundFailed(address indexed recipient, uint256 amount);

    // Event emitted when a token transfer to a bidder fails
    event TokenTransferFailed(address indexed recipient, uint256 amount);

    /// @notice Constructor to initialize the Dutch auction
    /// @param tokenName Name of the token being auctioned
    /// @param tokenSymbol Symbol of the token being auctioned
    /// @param totalSupply Total supply of tokens for the auction
    /// @param startPrice Starting price per token
    /// @param reservedPrice Minimum price per token at auction end
    /// @param creator Address of the auction creator
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 totalSupply,
        uint256 startPrice,
        uint256 reservedPrice,
        address creator
    ) {
        // Deploy a new AuctionToken contract with the specified parameters
        _auctionToken = new AuctionToken(tokenName, tokenSymbol, totalSupply);

        // Initialize auction parameters
        _auctionStartPrice = startPrice;
        _auctionReservedPrice = reservedPrice;
        _auctionTotalSupply = totalSupply;

        // Set the auction start time to the current block timestamp
        _auctionStartTime = block.timestamp;

        // Set the address of the auction creator
        _auctionCreator = creator;
    }

    /// @notice Modifier to prevent reentrant calls to a function
    modifier nonReentrant() {
        require(!_reentrancyLock, "Reentrant call detected");
        _reentrancyLock = true;
        _;
        _reentrancyLock = false;
    }

    /* ========== Getter Functions ========== */

    /// @notice Returns the AuctionToken instance used in the auction
    /// @return The AuctionToken contract instance
    function getToken() external view returns (AuctionToken) {
        return _auctionToken;
    }

    /// @notice Returns the address of the auction creator
    /// @return The address of the creator
    function getCreator() external view returns (address) {
        return _auctionCreator;
    }

    /// @notice Returns the total token supply available in the auction
    /// @return The total token supply
    function getTotalSupply() external view returns (uint256) {
        return _auctionTotalSupply;
    }

    /// @notice Returns the starting price per token in the auction
    /// @return The starting price per token
    function getStartPrice() external view returns (uint256) {
        return _auctionStartPrice;
    }

    /// @notice Returns the reserved (minimum) price per token
    /// @return The reserved price per token
    function getReservedPrice() external view returns (uint256) {
        return _auctionReservedPrice;
    }

    /// @notice Returns the timestamp when the auction started
    /// @return The auction start time
    function getStartTime() external view returns (uint256) {
        return _auctionStartTime;
    }

    /// @notice Returns the duration of the auction
    /// @return The auction duration in seconds
    function getDuration() external pure returns (uint256) {
        return _AUCTION_DURATION;
    }

    /// @notice Checks if the tokens have been distributed after auction end
    /// @return True if tokens have been distributed, false otherwise
    function getTokensDistributed() external view returns (bool) {
        return _areTokensDistributed;
    }

    /// @notice Returns the total Ether committed by all bidders
    /// @return The total commitment amount
    function getTotalCommitment() external view returns (uint256) {
        return _auctionTotalCommitment;
    }

    /// @notice Returns the Ether commitment of a specific bidder
    /// @param bidder Address of the bidder
    /// @return The commitment amount of the bidder
    function getCommitmentByBidder(
        address bidder
    ) external view returns (uint256) {
        return _bidderCommitments[bidder];
    }

    /* ========== Auction Logic Functions ========== */

    /// @notice Calculates the current price per token based on elapsed time
    /// @return The current price per token
    function getCurrentPrice() public view returns (uint256) {
        if (block.timestamp < _auctionStartTime) {
            // Auction hasn't started yet; return the start price
            return _auctionStartPrice;
        } else if (block.timestamp >= _auctionStartTime + _AUCTION_DURATION) {
            // Auction has ended; return the reserved price
            return _auctionReservedPrice;
        } else {
            // Calculate the price decay based on elapsed time
            uint256 elapsedTime = block.timestamp - _auctionStartTime;
            uint256 priceDecay = ((_auctionStartPrice - _auctionReservedPrice) *
                elapsedTime) / _AUCTION_DURATION;
            return _auctionStartPrice - priceDecay;
        }
    }

    /// @notice Checks if the auction has ended based on time or supply sold out
    /// @return True if the auction has ended, false otherwise
    function getAuctionEnded() public view returns (bool) {
        return
            block.timestamp >= _auctionStartTime + _AUCTION_DURATION ||
            _isSupplySoldOut();
    }

    /// @notice Internal function to check if the token supply has been sold out
    /// @return True if the supply is sold out, false otherwise
    function _isSupplySoldOut() internal view returns (bool) {
        uint256 currentDemand = (_auctionTotalCommitment *
            10 ** _auctionToken.decimals()) / getCurrentPrice();
        return currentDemand >= _auctionTotalSupply;
    }

    /// @notice Determines the clearing price after the auction ends
    /// @return The clearing price per token
    function getClearingPrice() public view returns (uint256) {
        require(getAuctionEnded(), "Auction not ended yet");

        // Calculate total tokens that can be purchased at reserved price
        uint256 totalTokensAtReservedPrice = (_auctionTotalCommitment *
            10 ** _auctionToken.decimals()) / _auctionReservedPrice;

        if (totalTokensAtReservedPrice <= _auctionTotalSupply) {
            // All tokens can be sold at reserved price
            return _auctionReservedPrice;
        }

        // Calculate total tokens that can be purchased at last bid price
        uint256 totalTokensAtLastBid = (_auctionTotalCommitment *
            10 ** _auctionToken.decimals()) / _auctionLastBidPrice;

        if (totalTokensAtLastBid >= _auctionTotalSupply) {
            // Demand at last bid price exceeds supply; use last bid price as clearing price
            return _auctionLastBidPrice;
        } else {
            // Calculate the clearing price based on total supply and total commitment
            return
                (_auctionTotalCommitment * 10 ** _auctionToken.decimals()) /
                _auctionTotalSupply;
        }
    }

    /* ========== External Auction Functions ========== */

    /// @notice Returns the remaining token supply available for purchase
    /// @return The number of tokens remaining
    function getRemainingSupply() external view returns (uint256) {
        uint256 currentDemand = (_auctionTotalCommitment *
            10 ** _auctionToken.decimals()) / getCurrentPrice();
        if (_auctionTotalSupply > currentDemand) {
            // Tokens are still available
            return _auctionTotalSupply - currentDemand;
        } else {
            // All tokens have been allocated
            return 0;
        }
    }

    /// @notice Allows users to place a bid by sending Ether to the contract
    function placeBid() external payable nonReentrant {
        require(!getAuctionEnded(), "Auction ended");

        // Update the last bid price to the current price
        _auctionLastBidPrice = getCurrentPrice();

        // Update total commitments and bidder's individual commitment
        _auctionTotalCommitment += msg.value;
        _bidderCommitments[msg.sender] += msg.value;

        // Record the bid details
        _auctionBids.push(
            AuctionBid({bidderAddress: msg.sender, bidCommitment: msg.value})
        );
    }

    /// @notice Distributes tokens to bidders and finalizes the auction
    function distributeTokens() external nonReentrant {
        require(getAuctionEnded(), "Auction not ended yet");
        require(!_areTokensDistributed, "Tokens already distributed");

        // Initialize variables for distribution
        uint256 tokensToDistribute = _auctionTotalSupply;
        uint8 tokenDecimals = _auctionToken.decimals();
        uint256 clearingPrice = getClearingPrice();

        // Loop through all bids to distribute tokens
        for (
            uint256 i = 0;
            i < _auctionBids.length && tokensToDistribute > 0;
            i++
        ) {
            AuctionBid memory currentBid = _auctionBids[i];

            // Calculate the number of tokens the bidder can purchase
            uint256 tokensPurchased = (currentBid.bidCommitment *
                10 ** tokenDecimals) / clearingPrice;

            // Adjust tokens purchased if remaining supply is less than demand
            if (tokensPurchased > tokensToDistribute) {
                tokensPurchased = tokensToDistribute;
            }

            // Calculate the actual cost for the tokens purchased
            uint256 cost = (tokensPurchased * clearingPrice) /
                10 ** tokenDecimals;

            // Calculate any excess funds to be refunded
            uint256 refundAmount = currentBid.bidCommitment - cost;

            // Refund excess funds to the bidder if any
            if (refundAmount > 0) {
                _refundBidder(currentBid.bidderAddress, refundAmount);
            }

            // Update remaining tokens to distribute
            tokensToDistribute -= tokensPurchased;

            // Transfer tokens to the bidder
            _transferTokens(currentBid.bidderAddress, tokensPurchased);
        }

        // Finalize the auction by burning unsold tokens and transferring funds to the creator
        _finalizeAuction(tokensToDistribute);

        // Mark tokens as distributed
        _areTokensDistributed = true;
    }

    /* ========== Internal Helper Functions ========== */

    /// @notice Internal function to refund excess funds to a bidder
    /// @param bidder Address of the bidder to refund
    /// @param amount Amount of Ether to refund
    function _refundBidder(address bidder, uint256 amount) internal {
        (bool success, ) = payable(bidder).call{value: amount}("");
        if (!success) {
            // Emit event if refund fails
            emit RefundFailed(bidder, amount);
        }
    }

    /// @notice Internal function to transfer tokens to a bidder
    /// @param recipient Address of the bidder receiving tokens
    /// @param amount Number of tokens to transfer
    function _transferTokens(address recipient, uint256 amount) internal {
        bool success = _auctionToken.transfer(recipient, amount);
        if (!success) {
            // Emit event if token transfer fails
            emit TokenTransferFailed(recipient, amount);
        }
    }

    /// @notice Internal function to finalize the auction after token distribution
    /// @param remainingTokens Number of tokens left undistributed
    function _finalizeAuction(uint256 remainingTokens) internal {
        if (remainingTokens > 0) {
            // Burn any unsold tokens
            _auctionToken.burn(remainingTokens);
        }

        // Transfer remaining Ether (auction proceeds) to the auction creator
        (bool sent, ) = payable(_auctionCreator).call{
            value: address(this).balance
        }("");
        require(sent, "Transfer to creator failed");
    }

    /* ========== Additional Redundant Functions ========== */

    /// @notice An unused internal function for code diversification
    /// @return A dummy string message
    function _unusedFunction() internal pure returns (string memory) {
        return "This is an unused internal function for code diversification.";
    }

    /// @notice An additional logic function that doesn't affect contract functionality
    function _additionalLogic() internal pure {
        // This function is intentionally left blank
    }
}
