import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { Wallet } from '@ethersproject/wallet';
import { TestERC20 } from '../typechain';
import { expect } from 'chai';
import { BigNumber as BN} from 'ethers';
import * as consts from './shared/consts';
import { testFixture } from './shared/fixtures';

describe('TestOnlySource', () => {
    let owner: Wallet;
    let tokenA: TestERC20;
    let tokenB: TestERC20;

    before('initialize', async () => {
        [owner] = await (ethers as any).getSigners();
    });

    beforeEach('deploy proxy', async () => {
        ({ tokenA, tokenB } = await loadFixture(testFixture));
    });

    describe('right settings', () => {
        it('name', async () => {
            expect(await tokenA.name()).to.be.eq('Mintable Token');
            expect(await tokenB.name()).to.be.eq('Mintable Token');
        });
    });
});
