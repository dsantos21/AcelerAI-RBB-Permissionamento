const Validation = require('./fixtures/0_initial_validation');
const Admin = require('./fixtures/1_deploy_admin_contract');
const NodeIngressRules = require('./fixtures/2_deploy_node_ingress_rules_contract');
const AccountIngressRules = require('./fixtures/3_deploy_account_ingress_rules_contract');

module.exports = async () => {
    Validation.validate();
    await Admin.deploy();
    await NodeIngressRules.deploy();
    await AccountIngressRules.deploy();  
};