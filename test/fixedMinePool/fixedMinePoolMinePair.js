const fixedMinePool = artifacts.require("fixedMinePool_test");
const CFNX = artifacts.require("CFNX");
const BN = require("bn.js");
let PeriodTime = 90*86400;
const {migrateTestMinePool,checkUserDistribution} = require("./testFunctions.js")
contract('fixedMinePool', function (accounts){
    it('fixedMinePool Locked stake FPTB function', async function (){
        let contracts = await migrateTestMinePool(accounts);
        let nowId = await contracts.minePool.getCurrentPeriodID();
        await contracts.minePool.stakeFPTA(100000);;
        await contracts.minePool.stakeFPTB(100000,2);
        let fptA = await contracts.minePool.getUserFPTABalance(accounts[0]);
        let fptB = await contracts.minePool.getUserFPTBBalance(accounts[0]);
        assert.equal(fptA.toNumber(),100000,"getUserFPTABalance Error");
        assert.equal(fptB.toNumber(),100000,"getUserFPTBBalance Error");
        let userPeriodId = await contracts.minePool.getUserMaxPeriodId(accounts[0]);
        assert.equal(userPeriodId.toNumber(),nowId.toNumber()+1,"getUserMaxPeriodId Error");
        await checkUserDistribution(contracts,accounts[0]);
        await contracts.minePool.stakeFPTB(100000,2);
        fptA = await contracts.minePool.getUserFPTABalance(accounts[0]);
        fptB = await contracts.minePool.getUserFPTBBalance(accounts[0]);
        assert.equal(fptA.toNumber(),100000,"getUserFPTABalance Error");
        assert.equal(fptB.toNumber(),200000,"getUserFPTBBalance Error");
        contractBalance = await contracts.CFNXB.balanceOf(contracts.minePool.address);
        assert.equal(contractBalance.toNumber(),200000,"getUserFPTABalance Error");
        await checkUserDistribution(contracts,accounts[0]);
        await contracts.minePool.unstakeFPTB(100000);
        fptA = await contracts.minePool.getUserFPTABalance(accounts[0]);
        fptB = await contracts.minePool.getUserFPTBBalance(accounts[0]);
        assert.equal(fptA.toNumber(),100000,"getUserFPTABalance Error");
        assert.equal(fptB.toNumber(),100000,"getUserFPTBBalance Error");
        contractBalance = await contracts.CFNXB.balanceOf(contracts.minePool.address);
        assert.equal(contractBalance.toNumber(),100000,"getUserFPTABalance Error");
        await checkUserDistribution(contracts,accounts[0]);
        await contracts.minePool.unstakeFPTB(100000);
        fptA = await contracts.minePool.getUserFPTABalance(accounts[0]);
        fptB = await contracts.minePool.getUserFPTBBalance(accounts[0]);
        assert.equal(fptA.toNumber(),100000,"getUserFPTABalance Error");
        assert.equal(fptB.toNumber(),0,"getUserFPTBBalance Error");
        contractBalance = await contracts.CFNXA.balanceOf(contracts.minePool.address);
        assert.equal(contractBalance.toNumber(),100000,"getUserFPTABalance Error");
        await checkUserDistribution(contracts,accounts[0]);
    });
    it('fixedMinePool Locked stake FPTB function unStakeA', async function (){
        let contracts = await migrateTestMinePool(accounts);
        let nowId = await contracts.minePool.getCurrentPeriodID();
        await contracts.minePool.stakeFPTA(100000);;
        await contracts.minePool.stakeFPTB(100000,2);
        let fptA = await contracts.minePool.getUserFPTABalance(accounts[0]);
        let fptB = await contracts.minePool.getUserFPTBBalance(accounts[0]);
        assert.equal(fptA.toNumber(),100000,"getUserFPTABalance Error");
        assert.equal(fptB.toNumber(),100000,"getUserFPTBBalance Error");
        let userPeriodId = await contracts.minePool.getUserMaxPeriodId(accounts[0]);
        assert.equal(userPeriodId.toNumber(),nowId.toNumber()+1,"getUserMaxPeriodId Error");
        await checkUserDistribution(contracts,accounts[0]);
        await contracts.minePool.stakeFPTA(100000);
        fptA = await contracts.minePool.getUserFPTABalance(accounts[0]);
        fptB = await contracts.minePool.getUserFPTBBalance(accounts[0]);
        assert.equal(fptA.toNumber(),200000,"getUserFPTABalance Error");
        assert.equal(fptB.toNumber(),100000,"getUserFPTBBalance Error");
        contractBalance = await contracts.CFNXA.balanceOf(contracts.minePool.address);
        assert.equal(contractBalance.toNumber(),200000,"getUserFPTABalance Error");
        await checkUserDistribution(contracts,accounts[0]);
        await contracts.minePool.unstakeFPTA(100000);
        fptA = await contracts.minePool.getUserFPTABalance(accounts[0]);
        fptB = await contracts.minePool.getUserFPTBBalance(accounts[0]);
        assert.equal(fptA.toNumber(),100000,"getUserFPTABalance Error");
        assert.equal(fptB.toNumber(),100000,"getUserFPTBBalance Error");
        contractBalance = await contracts.CFNXB.balanceOf(contracts.minePool.address);
        assert.equal(contractBalance.toNumber(),100000,"getUserFPTABalance Error");
        await checkUserDistribution(contracts,accounts[0]);
        await contracts.minePool.unstakeFPTA(100000);
        fptA = await contracts.minePool.getUserFPTABalance(accounts[0]);
        fptB = await contracts.minePool.getUserFPTBBalance(accounts[0]);
        assert.equal(fptA.toNumber(),0,"getUserFPTABalance Error");
        assert.equal(fptB.toNumber(),100000,"getUserFPTBBalance Error");
        contractBalance = await contracts.CFNXB.balanceOf(contracts.minePool.address);
        assert.equal(contractBalance.toNumber(),100000,"getUserFPTABalance Error");
        await checkUserDistribution(contracts,accounts[0]);
    });
    it('fixedMinePool Locked stake FPTB function changePeriod', async function (){
        let contracts = await migrateTestMinePool(accounts);
        let nowId = await contracts.minePool.getCurrentPeriodID();
        await contracts.minePool.stakeFPTA(100000);;
        await contracts.minePool.stakeFPTB(100000,0);
        let fptA = await contracts.minePool.getUserFPTABalance(accounts[0]);
        let fptB = await contracts.minePool.getUserFPTBBalance(accounts[0]);
        assert.equal(fptA.toNumber(),100000,"getUserFPTABalance Error");
        assert.equal(fptB.toNumber(),100000,"getUserFPTBBalance Error");
        let userPeriodId = await contracts.minePool.getUserMaxPeriodId(accounts[0]);
        assert.equal(userPeriodId.toNumber(),0,"getUserMaxPeriodId Error");
        for (var i=1;i<10;i++){
            fptA = await contracts.minePool.getUserFPTABalance(accounts[0]);
            fptB = await contracts.minePool.getUserFPTBBalance(accounts[0]);
            assert.equal(fptA.toNumber(),100000,"getUserFPTABalance Error");
            assert.equal(fptB.toNumber(),100000,"getUserFPTBBalance Error");
            await contracts.minePool.changeFPTBLockedPeriod(i);
            let userPeriodId = await contracts.minePool.getUserMaxPeriodId(accounts[0]);
            assert.equal(userPeriodId.toNumber(),nowId.toNumber()+i-1,"getUserMaxPeriodId Error");
            await checkUserDistribution(contracts,accounts[0]);
        }

    });
});