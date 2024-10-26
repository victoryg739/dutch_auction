// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Custom Errors
error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed);
error ERC20InvalidSender(address sender);
error ERC20InvalidReceiver(address receiver);
error ERC20InsufficientAllowance(
    address spender,
    uint256 allowance,
    uint256 needed
);
error ERC20InvalidApprover(address approver);
error ERC20InvalidSpender(address spender);

contract AuctionToken {
    mapping(address => uint256) private _token_balances;
    mapping(address => mapping(address => uint256)) private _token_allowances;
    uint256 private _token_totalSupply;
    string private _token_name;
    string private _token_symbol;

    constructor(string memory name_, string memory symbol_, uint256 preMint_) {
        _token_name = name_;
        _token_symbol = symbol_;
        _mint(msg.sender, preMint_);
    }

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    function name() public view returns (string memory) {
        return _token_name;
    }

    function symbol() public view returns (string memory) {
        return _token_symbol;
    }

    function decimals() public pure returns (uint8) {
        return 18;
    }

    function totalSupply() public view returns (uint256) {
        return _token_totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _token_balances[account];
    }

    function transfer(address to, uint256 value) public returns (bool) {
        address owner = msg.sender;
        _transfer(owner, to, value);
        return true;
    }

    function allowance(
        address owner,
        address spender
    ) public view returns (uint256) {
        return _token_allowances[owner][spender];
    }

    function approve(address spender, uint256 value) public returns (bool) {
        address owner = msg.sender;
        _approve(owner, spender, value);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public returns (bool) {
        address spender = msg.sender;
        _spendAllowance(from, spender, value);
        _transfer(from, to, value);
        return true;
    }

    function burn(uint256 value) public {
        _burn(msg.sender, value);
    }

    // Internal functions
    function _transfer(address from, address to, uint256 value) internal {
        if (from == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        if (to == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(from, to, value);
    }

    function _update(address from, address to, uint256 value) internal {
        if (from == address(0)) {
            _token_totalSupply += value;
        } else {
            uint256 fromBalance = _token_balances[from];
            if (fromBalance < value) {
                revert ERC20InsufficientBalance(from, fromBalance, value);
            }
            unchecked {
                _token_balances[from] = fromBalance - value;
            }
        }

        if (to == address(0)) {
            unchecked {
                _token_totalSupply -= value;
            }
        } else {
            unchecked {
                _token_balances[to] += value;
            }
        }

        emit Transfer(from, to, value);
    }

    function _mint(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(address(0), account, value);
    }

    function _burn(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        _update(account, address(0), value);
    }

    function _approve(address owner, address spender, uint256 value) internal {
        _approve(owner, spender, value, true);
    }

    function _approve(
        address owner,
        address spender,
        uint256 value,
        bool emitEvent
    ) internal {
        if (owner == address(0)) {
            revert ERC20InvalidApprover(address(0));
        }
        if (spender == address(0)) {
            revert ERC20InvalidSpender(address(0));
        }
        _token_allowances[owner][spender] = value;
        if (emitEvent) {
            emit Approval(owner, spender, value);
        }
    }

    function _spendAllowance(
        address owner,
        address spender,
        uint256 value
    ) internal {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            if (currentAllowance < value) {
                revert ERC20InsufficientAllowance(
                    spender,
                    currentAllowance,
                    value
                );
            }
            unchecked {
                _approve(owner, spender, currentAllowance - value, false);
            }
        }
    }

    // New redundant function
    function _unusedInternalFunction() internal pure returns (string memory) {
        return
            "This function is redundant and only exists for differentiation.";
    }
}
