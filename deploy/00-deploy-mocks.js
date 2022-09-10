const { network } = require("hardhat")
const {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
} = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    //these param come from the hre
    const { deploy, log } = deployments //pulling 2 function out of deployments
    const { deployer } = await getNamedAccounts() //calls the hardhat.config.js function passes as a parameter

    //if we deploy in a testnet, this should not deploy

    //we check if the name of the network is inside an array with .includes(), then deploy mock if true
    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...")
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER], //check in MockV3Aggregator the params the constructor function takes
        })
        log("Mocks deployed!")
        log("--------------------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
