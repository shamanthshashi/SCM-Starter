// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Assessment {
    uint256 public balance;
    bool public eligible=false;
    uint public number;

    constructor(uint initBalance) payable {
        balance = initBalance;
    }

    function getBalance() public view returns(uint256){
        return balance;
    }



    function makeGuess(uint256 guess) public   {
        number= uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, uint256(3))))%3+1;
        if(guess==number){
            eligible=true;
        }
    }

    function claimPrize() public {
        
        if (eligible == true) {
            balance += 500;
        }
    }
}
