pragma solidity ^0.8.13;

import './chainlink-ocr/OffchainAggregator.sol';

import {AbstractCcipReadIsm} from "@hyperlane-xyz/core/contracts/isms/ccip-read/AbstractCcipReadIsm.sol";
import {IInterchainSecurityModule} from "@hyperlane-xyz/core/contracts/interfaces/IInterchainSecurityModule.sol";
import {AbstractMultisigIsm} from "@hyperlane-xyz/core/contracts/isms/multisig/AbstractMultisigIsm.sol";
import {Message} from "@hyperlane-xyz/core/contracts/libs/Message.sol";
import {HyperlaneConnectionClient} from "@hyperlane-xyz/core/contracts/HyperlaneConnectionClient.sol"; 

import "hardhat/console.sol";

contract ChainlinkAggregator is OffchainAggregator, AbstractCcipReadIsm, HyperlaneConnectionClient {
    using Message for bytes;

    /*
     * @param _maximumGasPrice highest gas price for which transmitter will be compensated
     * @param _reasonableGasPrice transmitter will receive reward for gas prices under this value
     * @param _microLinkPerEth reimbursement per ETH of gas cost, in 1e-6LINK units
     * @param _linkGweiPerObservation reward to oracle for contributing an observation to a successfully transmitted report, in 1e-9LINK units
     * @param _linkGweiPerTransmission reward to transmitter of a successful report, in 1e-9LINK units
     * @param _link address of the LINK contract
     * @param _minAnswer lowest answer the median of a report is allowed to be
     * @param _maxAnswer highest answer the median of a report is allowed to be
     * @param _billingAccessController access controller for billing admin functions
     * @param _requesterAccessController access controller for requesting new rounds
     * @param _decimals answers are stored in fixed-point format, with this many digits of precision
     * @param _description short human-readable description of observable this contract's answers pertain to
     */
    constructor(
        uint32 _maximumGasPrice,
        uint32 _reasonableGasPrice,
        uint32 _microLinkPerEth,
        uint32 _linkGweiPerObservation,
        uint32 _linkGweiPerTransmission,
        LinkTokenInterface _link,
        int192 _minAnswer,
        int192 _maxAnswer,
        AccessControllerInterface _billingAccessController,
        AccessControllerInterface _requesterAccessController,
        uint8 _decimals,
        string memory _description
    )
        OffchainAggregator(
            _maximumGasPrice,
            _reasonableGasPrice,
            _microLinkPerEth,
            _linkGweiPerObservation,
            _linkGweiPerTransmission,
            _link,
            _minAnswer,
            _maxAnswer,
            _billingAccessController,
            _requesterAccessController,
            _decimals,
            _description
        )
    {

    }

    /**
     * @notice Initializes the Router contract with Hyperlane core contracts and the address of the interchain security module.
     * @param _mailbox The address of the mailbox contract.
     * @param _interchainGasPaymaster The address of the interchain gas paymaster contract.
     * @param _interchainSecurityModule The address of the interchain security module contract.
     * @param _owner The address with owner privileges.
     */
    function initialize(
        address _mailbox,
        address _interchainGasPaymaster,
        address _interchainSecurityModule,
        address _owner
    ) external initializer {
        __HyperlaneConnectionClient_initialize(
            _mailbox,
            _interchainGasPaymaster,
            _interchainSecurityModule,
            _owner
        );
    }

    /**
     * No op because everything happens in the verify function
     */
    function handle(
        uint32,
        bytes32,
        bytes calldata _report
    ) public onlyMailbox {
  
    }

    /**
   * @notice sets offchain reporting protocol configuration incl. participating oracles
   * @param _signers addresses with which oracles sign the reports
   * @param _transmitters addresses oracles use to transmit the reports
   * @param _threshold number of faulty oracles the system can tolerate
   * @param _encodedConfigVersion version number for offchainEncoding schema
   * @param _encoded encoded off-chain oracle configuration
   */
  function setConfig(
    address[] calldata _signers,
    address[] calldata _transmitters,
    uint8 _threshold,
    uint64 _encodedConfigVersion,
    bytes calldata _encoded
  )
    external
    onlyOwner()
  {
    super._setConfig(_signers, _transmitters, _threshold, _encodedConfigVersion, _encoded);
  }

    /**
     * @param _metadata ABI encoded module metadata
     * @param _message Formatted Hyperlane message (see Message.sol).
     */
    function verify(bytes calldata _metadata, bytes calldata _message) external returns (bool) {
      (bytes memory _report, bytes32[] memory _rs, bytes32[] memory _ss, bytes32 _vs) = abi.decode(
        // remove function selector
        _metadata[4:], 
        (bytes, bytes32[], bytes32[], bytes32)
      );
      transmit(_report, _rs, _ss, _vs);
      return true;
    }

}
