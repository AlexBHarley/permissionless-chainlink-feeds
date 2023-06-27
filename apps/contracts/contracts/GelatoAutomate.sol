// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IMailbox} from "@hyperlane-xyz/core/contracts/interfaces/IMailbox.sol";
import {IInterchainGasPaymaster} from "@hyperlane-xyz/core/contracts/interfaces/IInterchainGasPaymaster.sol";
import {TypeCasts} from "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";

import {AggregatorInterface} from "./chainlink-ocr/AggregatorInterface.sol";
import {AggregatorV3Interface} from "./chainlink-ocr/AggregatorV3Interface.sol";
import {OpsReady} from "./gelato/OpsReady.sol";

contract GelatoAutomate is OpsReady {
    IMailbox public mailbox;
    IInterchainGasPaymaster public igp;

    address payable owner;

    AggregatorInterface public aggregator;
    uint32 public destinationDomain;
    address public destinationAggregator;

    uint256 public latestRoundRelayed;

    uint256 private constant PHASE_OFFSET = 64;

    constructor(
        address payable _ops,
        address payable _taskCreator,
        address _mailbox,
        address _igp,
        address _aggregator,
        uint32 _destinationDomain,
        address _destinationAggregator
    ) OpsReady(_ops, _taskCreator) {
        owner = _taskCreator;
        mailbox = IMailbox(_mailbox);
        igp = IInterchainGasPaymaster(_igp);
        aggregator = AggregatorInterface(_aggregator);
        destinationDomain = _destinationDomain;
        destinationAggregator = _destinationAggregator;
    }

    receive() external payable {}

    // https://github.com/smartcontractkit/chainlink/blob/52c55cc298735fedc3650bc7cd5c9b6fd6aae5fd/contracts/src/v0.7/dev/AggregatorProxy.sol#L344
    // The ID we get back from the feed is accounts for the phase and aggregator. This gets
    // us the feed the aggregator understands
    function parseIds(uint256 _roundId) internal view returns (uint16, uint64) {
        uint16 phaseId = uint16(_roundId >> PHASE_OFFSET);
        uint64 aggregatorRoundId = uint64(_roundId);

        return (phaseId, aggregatorRoundId);
    }

    function relayRoundData(uint256) public {
        uint256 latestRound = aggregator.latestRound();
        require(
            latestRound > latestRoundRelayed,
            "latestRound > latestRoundRelayed"
        );

        (uint16 _phaseId, uint256 roundId) = parseIds(latestRound);

        latestRoundRelayed = latestRound;
        bytes32 messageId = mailbox.dispatch(
            destinationDomain,
            TypeCasts.addressToBytes32(destinationAggregator),
            abi.encode(roundId)
        );

        // Hyperlane fees
        uint256 gasAmount = 350_000;
        uint256 quote = igp.quoteGasPayment(destinationDomain, gasAmount);
        igp.payForGas{value: quote}(
            messageId,
            destinationDomain,
            gasAmount,
            address(this)
        );

        // Gelato fees
        (uint256 fee, address feeToken) = _getFeeDetails();
        _transfer(fee, feeToken);
    }

    function checker() external view returns (bool, bytes memory) {
        uint256 latestRound = aggregator.latestRound();

        if (latestRound > latestRoundRelayed) {
            return (true, abi.encodeCall(this.relayRoundData, (1)));
        }

        return (false, abi.encodeCall(this.relayRoundData, (0)));
    }

    function withdrawETH() external {
        require(msg.sender == owner, "!owner");

        (bool sent, bytes memory _data) = owner.call{
            value: address(this).balance
        }("");
        require(sent, "Failed to send Ether");
    }
}
