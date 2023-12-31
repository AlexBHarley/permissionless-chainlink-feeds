pragma solidity ^0.8.13;

import {AbstractCcipReadIsm} from "@hyperlane-xyz/core/contracts/isms/ccip-read/AbstractCcipReadIsm.sol";
import {IInterchainSecurityModule, ISpecifiesInterchainSecurityModule} from "@hyperlane-xyz/core/contracts/interfaces/IInterchainSecurityModule.sol";
import {IMailbox} from "@hyperlane-xyz/core/contracts/interfaces/IMailbox.sol";
import {Message} from "@hyperlane-xyz/core/contracts/libs/Message.sol";

import "./chainlink-ocr/OffchainAggregator.sol";

contract ChainlinkAggregator is
    OffchainAggregator,
    AbstractCcipReadIsm,
    ISpecifiesInterchainSecurityModule
{
    using Message for bytes;

    IMailbox mailbox;

    string[] public offchainUrls;
    uint32 public origin;

    /**
     * For ease of deployment & initialisation, a few things are bundled in here.
     *
     * 1. Constructor data for the Chainlink OffchainAggregator
     * 2. setConfig data for initialization of the Chainlink OffchainAggregator
     * 3. Hyperlane specific things like the Mailbox address and CCIP Read ISM URLs.
     */
    constructor(
        // OffchainAggregator constructor
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
        string memory _description,
        // OffchainAggregator setConfig
        address[] memory _signers,
        address[] memory _transmitters,
        uint8 _threshold,
        uint64 _encodedConfigVersion,
        bytes memory _encoded,
        // Hyperlane
        IMailbox _mailbox,
        string[] memory _offchainUrls,
        uint32 _origin
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
        mailbox = _mailbox;
        offchainUrls = _offchainUrls;
        origin = _origin;
        super._setConfig(
            _signers,
            _transmitters,
            _threshold,
            _encodedConfigVersion,
            _encoded
        );
    }

    /**
     * No-op, everything happens in the verify function
     */
    function handle(uint32, bytes32, bytes calldata _report) public {}

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
    ) public onlyOwner {
        super._setConfig(
            _signers,
            _transmitters,
            _threshold,
            _encodedConfigVersion,
            _encoded
        );
    }

    /**
     * @param _metadata ABI encoded module metadata
     * @param _message Formatted Hyperlane message (see Message.sol).
     */
    function verify(
        bytes calldata _metadata,
        bytes calldata _message
    ) external returns (bool) {
        (
            bytes memory _report,
            bytes32[] memory _rs,
            bytes32[] memory _ss,
            bytes32 _vs
        ) = abi.decode(
                // remove function selector from original tx data
                _metadata[4:],
                (bytes, bytes32[], bytes32[], bytes32)
            );
        transmit(_report, _rs, _ss, _vs);
        return true;
    }

    function setOffchainUrls(string[] memory urls) external onlyOwner {
        require(urls.length > 0, "!length");
        offchainUrls = urls;
    }

    function getOffchainUrls() external view returns (string[] memory) {
        return offchainUrls;
    }

    function interchainSecurityModule()
        external
        view
        returns (IInterchainSecurityModule)
    {
        return IInterchainSecurityModule(address(this));
    }

    function getOffchainVerifyInfo(
        bytes calldata _message
    ) external view override {
        revert OffchainLookup(
            address(this),
            offchainUrls,
            _message,
            ChainlinkAggregator.process.selector,
            _message
        );
    }

    function process(
        bytes calldata _metadata,
        bytes calldata _message
    ) external {
        mailbox.process(_metadata, _message);
    }
}
