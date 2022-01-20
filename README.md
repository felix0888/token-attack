# Token Attack

Smart Contract Security Practice | Lv5 Token Attack

```
!!! DON'T TRY ON MAINNET !!!
```

## Summary
The goal of this level is for you to hack the basic token contract below.

#### Things that might help:
- What is an odometer?

#### What you will learn?
- What is overflow/underflow of unsigned integers in Solidity?
- How to treat overflow/underflow?
- Why is it important to check breaking changes before upgrading the Solidity version?

## Smart Contract Code
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

contract Token {

  mapping(address => uint) balances;
  uint public totalSupply;

  constructor(uint _initialSupply) public {
    balances[msg.sender] = totalSupply = _initialSupply;
  }

  function transfer(address _to, uint _value) public returns (bool) {
    require(balances[msg.sender] - _value >= 0);
    balances[msg.sender] -= _value;
    balances[_to] += _value;
    return true;
  }

  function balanceOf(address _owner) public view returns (uint balance) {
    return balances[_owner];
  }
}
```

## Security pitfall in the contract
#### Overflow and Underflow of uint[xxx]
An overflow/underflow happens when an arithmetic operation reaches the maximum or minimum size of a type. For instance if a number is stored in the uint8 type, it means that the number is stored in a 8 bits unsigned number ranging from 0 to 2^8-1. In computer programming, an integer overflow occurs when an arithmetic operation attempts to create a numeric value that is outside of the range that can be represented with a given number of bits – either larger than the maximum or lower than the minimum representable value.
```solidity
pragma solidity ^0.6.0;
...
  uint8 a = 0;
  uint8 b = 255;
  console.log(a--); // 255
  console.log(b++); // 0
...
```

#### What is the problem of the contract? How can it be exposed?
The `transfer` function of `Token` contract has bugs.
```solidity
require(balances[msg.sender] - _value >= 0);
```
This statement is incorrect, it will never revert the transaction even if `balances[msg.sender]` is smaller than `_value`.
If `balances[msg.sender]` is smaller than `_value` underflow occurs like `a--` on the above example.

```solidity
balances[_to] += _value;
```
On the other hand, this statement will cause overflow like `b++` on the above example.
You have `2**256-1` tokens, if I tranfer `1` token to you your balance becomes `0` instead of `2**256`, something like this.

**How can it be exposed?**
Please check the `TokenAttack.test.js` file in this repository.
```javascript
...
await tokenAttack.connect(attacker).attack(token.address, ethers.utils.parseEther("1000000"));
...
```
`owner` has 20, `attacker` has 0, `alice` has 0.
The above script runs `attack` function of `TokenAttack` contract then that functio directly calls `transfer` function of `Token` contract with `attacker` and `1000000`.
`balances[msg.sender]` is 0(`msg.sender` is the TokenAttack contract), `_value` is `1000000`. Because of the uint's underflow, the transaction is not reverted as the writer thought.
It sends the `1000000` to `attacker`, `msg.sender`'s balance becomes a wrong value(the overflow result of 0 - 1000000, which is a large number), `owner`'s balance remains unchanged.

#### How to fix it?
1. Update the require statement.
```solidity
require(balances[msg.sender] >= _value && balances[_to]);
```

2. Use SafeMath.
```solidity
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Token {

  using SafeMath for uint;
  ...
  function transfer(address _to, uint _value) public returns (bool) {
    balances[msg.sender].sub(_value);
    balances[_to].add(_value);
    return true;
  }
  ...
}
```
On any overflow/underflow, SafeMath reverts the transaction with proper error message by using require statements in it.

3. Upgrade the Solidity version to higher than `0.8.0`

[Solidity v0.8.0 Breaking Changes](https://docs.soliditylang.org/en/develop/080-breaking-changes.html)
> Arithmetic operations revert on underflow and overflow. You can use unchecked { ... } to use the previous wrapping behaviour. Checks for overflow are very common, so we made them the default to increase readability of code, even if it comes at a slight increase of gas costs.

> Failing assertions and other internal checks like division by zero or arithmetic overflow do not use the invalid opcode but instead the revert opcode. More specifically, they will use error data equal to a function call to Panic(uint256) with an error code specific to the circumstances.

## Deploy & Test
#### Installation
```
npm hardhat install
npx hardhat node 
```

#### Deployment
```
npx hardhat run --network [NETWORK-NAME] scripts/deploy.js
```

#### Test
You must see the `attacker` has large number of tokens than `owner` has.
```
npx hardhat test
```

```console
dev@ubuntu:~/Documents/practice/token-attack$ npx hardhat test


  Token
    deployment
      ✓ should give msg.sender _initialSupply tokens
      ✓ should update the totalSupply
    #transfer, #balanceOf
      ✓ should decrease the sender balance and increase the receiver balance (105ms)

  TokenAttack
    deployment
      ✓ should set the attacker
    #attack
      ✓ should be reverted if non-attacker tries
      ✓ should transfer tokens more than the initial supply
```

If you're familiar with hardhat console, you can test the `token` on your local node by using `npx hardhat node` and `npx hardhat console`.
