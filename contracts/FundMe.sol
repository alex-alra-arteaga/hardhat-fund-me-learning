//Get funds from users
//Withdraw funds
//Set a minimum funding value in USD

// SPDX-License-Identifier: MIT

//Pragma
pragma solidity ^0.8.7;
//Imports
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";
//Error codes
////Good practice to put the contract name __ and the error
error FundMe__NotOwner();

//Interfaces, Libraries, Contracts
contract FundMe {
    //Type declarations
    using PriceConverter for uint256;

    //State variables
    mapping(address => uint256) public s_addressToAmountFunded;
    address[] public s_funders;

    address private immutable i_owner;
    uint256 public constant minimumUsd = 50 * 10**18;
    AggregatorV3Interface public s_priceFeed; //priceFeed it's variable and modularized depending on the chain

    modifier onlyOwner() {
        //require(msg.sender == i_owner, "Sender is not owner!");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    //Functions Order:
    //// constructor
    //// recieve
    //// fallback
    //// external
    //// public
    //// internal
    //// private
    //// view/pure

    constructor(address priceFeedAddress) {
        i_owner = msg.sender; //i_owner is going to be whoever deployed this contract
        s_priceFeed = AggregatorV3Interface(priceFeedAddress); //we use this for PriceConverter
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    /**
     * @notice This function funds this contract
     * @dev This implements price feeds as our library
     */

    function fund() public payable {
        //Want to be able to set a minimum fund amount in USD
        //1. How do we send ETH to this contract?
        require(
            msg.value.getConversionRate(s_priceFeed) >= minimumUsd,
            "Didn't send enough ETH"
        ); //1e18 == 1 * 10 ** 18 == 1eth
        s_funders.push(msg.sender); //msg.sender is a global keyword, msg.value stands for how much native blockchain currency is sent.
        //msg. sender is the address of whoever calls the font function
        s_addressToAmountFunded[msg.sender] = msg.value; //with this, by inserting the address, we get the value he gave
    }

    function withdraw() public onlyOwner {
        //withdraw the funds of the s_funders
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0; //when we withdraw, we set the address amount to 0 using the mapping
        }
        //reset the array
        s_funders = new address[](0); //we set it with 0 objects to start);
        //actually withdraw the funds
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    //instead, read from funders array in memory one time, and then read from memory instead of storage
    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;
        //currently, mappings can't be in memory
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    //View/pure

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
