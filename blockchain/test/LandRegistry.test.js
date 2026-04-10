import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("LandRegistry", function () {
  let registry;
  let admin, user1, user2;

  beforeEach(async function () {
    [admin, user1, user2] = await ethers.getSigners();
    const LandRegistry = await ethers.getContractFactory("LandRegistry");
    registry = await LandRegistry.deploy();
    await registry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the deployer as admin", async function () {
      expect(await registry.admin()).to.equal(admin.address);
    });

    it("Should start with zero land count", async function () {
      expect(await registry.landCount()).to.equal(0);
    });
  });

  describe("Add Land", function () {
    it("Should allow admin to add land", async function () {
      await expect(
        registry.addLand("Rahul Sharma", user1.address, "28.6139,77.2090", "Residential", ethers.parseEther("5"))
      ).to.emit(registry, "LandAdded");

      expect(await registry.landCount()).to.equal(1);
    });

    it("Should store correct land details", async function () {
      await registry.addLand("Rahul Sharma", user1.address, "28.6139,77.2090", "Residential", ethers.parseEther("5"));

      const land = await registry.getLand(1);
      expect(land.ownerName).to.equal("Rahul Sharma");
      expect(land.ownerWallet).to.equal(user1.address);
      expect(land.location).to.equal("28.6139,77.2090");
      expect(land.landType).to.equal("Residential");
      expect(land.price).to.equal(ethers.parseEther("5"));
    });

    it("Should reject non-admin", async function () {
      await expect(
        registry.connect(user1).addLand("Hacker", user1.address, "0,0", "Commercial", 100)
      ).to.be.revertedWith("LandRegistry: caller is not admin");
    });
  });

  describe("Transfer Ownership", function () {
    beforeEach(async function () {
      await registry.addLand("Rahul Sharma", user1.address, "28.6139,77.2090", "Residential", ethers.parseEther("5"));
    });

    it("Should transfer ownership", async function () {
      await expect(
        registry.transferOwnership(1, user2.address, "Priya Patel")
      ).to.emit(registry, "OwnershipTransferred");

      const land = await registry.getLand(1);
      expect(land.ownerName).to.equal("Priya Patel");
      expect(land.ownerWallet).to.equal(user2.address);
    });

    it("Should reject transfer to same owner", async function () {
      await expect(
        registry.transferOwnership(1, user1.address, "Rahul Sharma")
      ).to.be.revertedWith("LandRegistry: same owner");
    });

    it("Should reject non-admin transfer", async function () {
      await expect(
        registry.connect(user1).transferOwnership(1, user2.address, "Hacker")
      ).to.be.revertedWith("LandRegistry: caller is not admin");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await registry.addLand("Rahul", user1.address, "Loc1", "Agricultural", ethers.parseEther("2"));
      await registry.addLand("Priya", user2.address, "Loc2", "Commercial", ethers.parseEther("10"));
      await registry.addLand("Amit", user1.address, "Loc3", "Residential", ethers.parseEther("7"));
    });

    it("Should return lands by owner", async function () {
      const user1Lands = await registry.getLandsByOwner(user1.address);
      expect(user1Lands.length).to.equal(2);
    });

    it("Should return paginated all lands", async function () {
      const allLands = await registry.getAllLands(0, 10);
      expect(allLands.length).to.equal(3);
    });

    it("Should revert for non-existent land", async function () {
      await expect(registry.getLand(999)).to.be.revertedWith("LandRegistry: land does not exist");
    });
  });
});
