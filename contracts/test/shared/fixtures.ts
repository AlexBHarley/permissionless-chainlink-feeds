import { TestERC20 } from '../../typechain';
import { ethers } from 'hardhat';

interface TestFixture {
    tokenA: TestERC20;
    tokenB: TestERC20;
}

export const testFixture = async function (): Promise<TestFixture> {
    const tokenFactory = await ethers.getContractFactory('TestERC20');
    const tokenA = (await tokenFactory.deploy()) as TestERC20;
    const tokenB = (await tokenFactory.deploy()) as TestERC20;

    return { tokenA, tokenB };
};
