const Validation = require('./initial_validation');
const Admin = require('./deploy_admin_contract');
const NodeIngressRules = require('./deploy_node_ingress_rules_contract');
const AccountIngressRules = require('./deploy_account_ingress_rules_contract');


async function deployContracts() {
    await Validation.validate();

    const adminAddress = await Admin.deploy();
    await NodeIngressRules.deploy(adminAddress);
    await AccountIngressRules.deploy(adminAddress);
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
deployContracts().catch((error) => {
    console.log(error.data);
    console.error(error);
    process.exitCode = 1;
});