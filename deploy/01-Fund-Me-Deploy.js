//its the same to this, we're extrapolating only the networkConfig:
//const helperConfig = require("../helper-hardhat-config")
//const networkConfig = helperConfig.networkConfig
const { networkConfig, developmentChains } = require("../helper-hardhat-config") //extrapolate just networkConfig
const { network, deployments } = require("hardhat")
const { verify } = require("../utilities/verify")

//import networkConfig from helper-hardhat-config
/*const helperConfig = require("../helper-hardhat-config")*/ //extrapolate the whole file
/*const networkConfig = helperConfig.networkConfig*/ //¿same as the first?

module.exports = async ({ getNamedAccounts, deployments }) => {
    //these come from the hre
    const { deploy, log, get } = deployments //pulling 3 functions out of deployments
    const { deployer } = await getNamedAccounts() //calls the hardhat.config.js function passes as a parameter
    const chainId = network.config.chainId

    // if chainId is X use address Y
    // if chainId is Z use address A

    //checks for the chainId and takes the PriceFeedAddress
    //const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    let ethUsdPriceFeedAddress
    if (chainId == 31337) {
        const ethUsdAggregator = await get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }
    //if the contract doesn't exist, we deploy a minimal version of
    //for our local testing

    //what happens when we want to change chains?
    //when going for localhost or hardhat network we want to use a mock

    //if we deploy in Rinkeby, the mock won't deploy but the fundMe contract will, using the correct priceFeedAddress

    const args = [ethUsdPriceFeedAddress]

    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, //put price feed address
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1, //if we don't wait for 6 block confir, we do for 1
    })

    //if it doesn't have the etherscap api key, it will verify by itself once the blockConfirmations pass

    if (
        !developmentChains.includes(
            network.name && process.env.ETHERSCAN_API_KEY
        )
    ) {
        await verify(fundMe.address, args)
    }

    log("--------------------------------------")
}

module.exports.tags = ["all", "fundme"]
