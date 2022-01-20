const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token", function() {
  let Token, token;
  let owner, alice, bob, signers;
  const INITIAL_SUPPLY = ethers.utils.parseEther("1000");

  beforeEach(async function() {
    [owner, alice, bob, signers] = await ethers.getSigners();
    Token = await ethers.getContractFactory("Token");
    token = await Token.deploy(INITIAL_SUPPLY);
  });

  describe("deployment", function() {
    it("should give msg.sender _initialSupply tokens", async function() {
      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
    });

    it("should update the totalSupply", async function() {
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
    });
  });

  describe("#transfer, #balanceOf", function() {
    it("should decrease the sender balance and increase the receiver balance", async function() {
      await token.transfer(alice.address, ethers.utils.parseEther("100"));
      expect(await token.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("900"));
      expect(await token.balanceOf(alice.address)).to.equal(ethers.utils.parseEther("100"));

      await token.connect(alice).transfer(bob.address, ethers.utils.parseEther("30"));
      expect(await token.balanceOf(alice.address)).to.equal(ethers.utils.parseEther("70"));
      expect(await token.balanceOf(bob.address)).to.equal(ethers.utils.parseEther("30"));
    });
  });
});
