// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function getPrice(AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        //ABI
        //Address
        (, int256 price, , , ) = priceFeed.latestRoundData();
        //ETH in terms of USD
        //2000.00000000
        return uint256(price * 1e10); //10000000000 = 10*10
    }

    function getConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed); //How much this eth worths in USD
        //3000 * 10**18 = ETH/USD PRICE
        uint256 ethAmouintInUsd = (ethPrice * ethAmount) / 1e18;
        //The (3000 * e18, multiplied by lets say 2ETH (2*e18), and divided by e18)
        return ethAmouintInUsd;
        //To get something like $6000 * e18
    }
}
