const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenAttack", function() {
  let Token, token, TokenAttack, tokenAttack;
  let owner, attacker, alice, bob, signers;
  const INITIAL_SUPPLY = ethers.utils.parseEther("20");

  beforeEach(async function() {
    [owner, attacker, alice, bob, signers] = await ethers.getSigners();
    Token = await ethers.getContractFactory("Token");
    token = await Token.deploy(INITIAL_SUPPLY);
    TokenAttack = await ethers.getContractFactory("TokenAttack");
    tokenAttack = await TokenAttack.connect(attacker).deploy();
  });

  describe("deployment", async function() {
    it("should set the attacker", async function() {
      expect(await tokenAttack.attacker()).to.equal(attacker.address);
    });
  });

  describe("#attack", function() {
    it("should be reverted if non-attacker tries", async function() {
      await expect(
        tokenAttack.connect(alice).attack(token.address, ethers.utils.parseEther("1"))
      ).to.be.revertedWith(
        "TokenAttack: NOT_OWNER"
      );
    });

    it("should transfer tokens more than the initial supply", async function() {
      await tokenAttack.connect(attacker).attack(token.address, ethers.utils.parseEther("1000000"));
      expect(await token.balanceOf(attacker.address)).to.equal(ethers.utils.parseEther("1000000"));
    });
  });
});
