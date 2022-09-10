const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")

//contract scope
describe("FundMe", async function () {
    let fundMe
    let deployer
    let MockV3Aggregator
    //const sendValue = "1000000000000000000" //1 eth
    const sendValue = ethers.utils.parseEther("1") //1 eth, as above
    beforeEach(async function () {
        //deploy our fundMe contract
        //using Hardhat-deploy

        //returns the network.accounts on hardhat.config
        //const accounts = await ethers.getSigners()
        //tell which account we want connected to fundMe, {} to abstract only the deployer from getNamedAccounts (it's in hardhat.config.js)
        deployer = (await getNamedAccounts()).deployer
        //fixture allows us to run our entire deploy folder with as many tags as we want
        //by assign in all at deploy 00 and 01, they get targeted
        await deployments.fixture(["all"])
        //getContract gets the most recent deployment of whatever contract we tell it
        //we connect deployer with fundMe account, so when we call fundMe, it'll automatically be from the player account
        fundMe = await ethers.getContract("FundMe", deployer)
        MockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        )
    })
    //smaller scope
    //asserting things to faile
    describe("constructor", async function () {
        it("sets the aggregator addresses correctly", async function () {
            const response = await fundMe.getPriceFeed()
            assert.equal(response, MockV3Aggregator.address)
        })
    })
    //expecting things to fail
    describe("fund", async function () {
        it("Fails if you don't send enough ETH", async function () {
            //expect is from Waffle, import it from chai (in my case it auto imported it)
            await expect(fundMe.fund()).to.be.revertedWith(
                "You need to spend more ETH!"
            )
        })
        it("updated the amount funded data structure", async function () {
            await fundMe.fund({ value: sendValue })
            //deployer.address = msg.sender     getAddressToAmountFunded is mapping name
            //response should be the msg.value
            const response = await fundMe.getAddressToAmountFunded(
                deployer /*address*/
            )
            assert.equal(response.toString(), sendValue.toString())
        })
        it("Adds funder to array of funders", async function () {
            await fundMe.fund({ value: sendValue })
            const funder = await fundMe.getFunder(0)
            assert.equal(funder, deployer)
        })
    })
    describe("withdraw", async function () {
        //to test withdraw, we have to have money on the contract
        //write a beforeEach to give the money before the unit testing is done
        beforeEach(async function () {
            await fundMe.fund({ value: sendValue })
        })

        it("Withdraw ETH from a single founder", async function () {
            //Arrange
            ////Get starting balance of contract and deployer
            ////We later can see what happens when we call the withdawal function
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            ) //calls from the blockchain, has to be type, bigNumber
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            //Act
            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = transactionReceipt //
            const gasCost = gasUsed.mul(effectiveGasPrice)
            //stops the script at this line and allows us to drop a debug console and see all the variables that are happening at this time

            ////Now we wait and see if the startingFundMeBalance has been added to the deployer balance
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            //Assert
            ////the tx spent a little bit of gas, we have to add the gas cost
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(gasCost).toString() //bigNumber .add  |  .toString() because bigNumbers are objects
            )
        })
        it("allows us to withdraw with multiple funders", async function () {
            //Arrange
            const accounts = await ethers.getSigners()
            for (let i = 1; i < 6; i++) {
                //we call the connect function and assign it the acccount array because was previously connected to deployer
                const fundMeConnectedContract = await fundMe.connect(
                    accounts[i]
                )
                await fundMeConnectedContract.fund({ value: sendValue })
            }
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            ) //calls from the blockchain, has to be type, bigNumber
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            //Act
            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)
            //Assert
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(gasCost).toString() //bigNumber .add  |  .toString() because bigNumbers are objects
            )
            //Make sure that the funders are reset properly
            await expect(fundMe.getFunder(0)).to.be.reverted

            for (i = 1; i < 6; i++) {
                assert.equal(
                    await fundMe.getAddressToAmountFunded(accounts[i].address),
                    0
                )
            }
        })
        it("Only allows the owner to withdraw", async function () {
            const accounts = await ethers.getSigners()
            const attacker = accounts[1]
            const attackerConnectedContract = await fundMe.connect(attacker)
            //they should not be able to withdraw     |   to make sure it's reverted by the notOwner error
            await expect(
                attackerConnectedContract.withdraw()
            ).to.be.revertedWith("FundMe__NotOwner")
        })
        it("Withdraw ETH from a single founder", async function () {
            //Arrange
            ////Get starting balance of contract and deployer
            ////We later can see what happens when we call the withdawal function
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            ) //calls from the blockchain, has to be type, bigNumber
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            //Act
            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = transactionReceipt //
            const gasCost = gasUsed.mul(effectiveGasPrice)
            //stops the script at this line and allows us to drop a debug console and see all the variables that are happening at this time

            ////Now we wait and see if the startingFundMeBalance has been added to the deployer balance
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            //Assert
            ////the tx spent a little bit of gas, we have to add the gas cost
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(gasCost).toString() //bigNumber .add  |  .toString() because bigNumbers are objects
            )
        })
        it("cheaperWithdraw testing...", async function () {
            //Arrange
            const accounts = await ethers.getSigners()
            for (let i = 1; i < 6; i++) {
                //we call the connect function and assign it the acccount array because was previously connected to deployer
                const fundMeConnectedContract = await fundMe.connect(
                    accounts[i]
                )
                await fundMeConnectedContract.fund({ value: sendValue })
            }
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            ) //calls from the blockchain, has to be type, bigNumber
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            //Act
            const transactionResponse = await fundMe.cheaperWithdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)
            //Assert
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(gasCost).toString() //bigNumber .add  |  .toString() because bigNumbers are objects
            )
            //Make sure that the funders are reset properly
            await expect(fundMe.getFunder(0)).to.be.reverted

            for (i = 1; i < 6; i++) {
                assert.equal(
                    await fundMe.getAddressToAmountFunded(accounts[i].address),
                    0
                )
            }
        })
    })
})
