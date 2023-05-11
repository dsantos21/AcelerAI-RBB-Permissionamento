const Web3Utils = require("web3-utils");

const enodeToParams = enodeURL => {
    let enodeId = "";
    let enodeHigh = "";
    let enodeLow = "";
    let nodeType = "";
    let geoHash = "";
    let name = "";
    let organization = "";

    const splitURL = enodeURL.split("//")[1];
    if (splitURL) {
        [enodeId, nodeType, geoHash, name, organization] = splitURL.split("|");
        if (enodeId && enodeId.length === 128) {
            enodeHigh = "0x" + enodeId.slice(0, 64);
            enodeLow = "0x" + enodeId.slice(64);
        }
    }
    
    return {
        enodeHigh,
        enodeLow,
        nodeType,
        geoHash,
        name,
        organization
    };
};

const isValidEnode = str => {
    return !Object.values(enodeToParams(str)).some(value => !value);
};

function isInitialAdminAccountsAvailable() {
    return process.env.INITIAL_ADMIN_ACCOUNTS;
}

function isInitialAllowlistedAccountsAvailable() {
    if (process.env.INITIAL_ALLOWLISTED_ACCOUNTS) {
        return process.env.INITIAL_ALLOWLISTED_ACCOUNTS;
    }
    if (process.env.INITIAL_WHITELISTED_ACCOUNTS) {
        console.warn("INITIAL_WHITELISTED_ACCOUNTS has been deprecated. Please use INITIAL_ALLOWLISTED_ACCOUNTS instead.");
        return process.env.INITIAL_WHITELISTED_ACCOUNTS;
    }
}

function isInitialAllowlistedNodesAvailable() {
    if (process.env.INITIAL_ALLOWLISTED_NODES) {
        return process.env.INITIAL_ALLOWLISTED_NODES;
    }
    if (process.env.INITIAL_WHITELISTED_NODES) {
        console.warn("INITIAL_WHITELISTED_NODES has been deprecated. Please use INITIAL_ALLOWLISTED_NODES instead.");
        return process.env.INITIAL_WHITELISTED_NODES;
    }
}

function getInitialAdminAccounts() {
    console.log(isInitialAdminAccountsAvailable());
    return getAccounts(isInitialAdminAccountsAvailable());
}

function getInitialAllowlistedAccounts() {
    console.log(isInitialAllowlistedAccountsAvailable());
    return getAccounts(isInitialAllowlistedAccountsAvailable());
}

function getInitialAllowlistedNodes() {
    let envInitialAllowlistedNodes = isInitialAllowlistedNodesAvailable();
    console.log(isInitialAllowlistedNodesAvailable());
    let validENodes = new Set();
    if (envInitialAllowlistedNodes) {
        let invalidENodes = new Set();
        let initialAllowlistedNodesList = envInitialAllowlistedNodes.split(/,/).map(n => n.trim());

        //Convert to enode structure
        if(initialAllowlistedNodesList && initialAllowlistedNodesList.length > 0) {
            for (i=0; i < initialAllowlistedNodesList.length; i++) {
                let enode = initialAllowlistedNodesList[i];
                if (isValidEnode(enode)) {
                    if(validENodes.has(enode)) {
                        console.log("     > Warning: Duplicate eNode Address: " + enode);
                    } else {
                        validENodes.add(enode);
                    }
                } else {
                    invalidENodes.add(enode);
                }
            }

            if (invalidENodes.size > 0) {
                throw "" + [...invalidENodes];
            }
        }  
    } 
    return [...validENodes];
}

function getAccounts(accounts) {
    if (accounts) {
        let invalidAccounts = new Set();
        let validAccounts = new Set();
        let accountsArray = accounts.split(/,/).map(
            function(acc) {
                let trimmedAcc = acc.trim();
                if (!trimmedAcc.startsWith("0x")) {
                    trimmedAcc = "0x" + trimmedAcc;
                }
                trimmedAcc = trimmedAcc.toLowerCase();
                if (!Web3Utils.isAddress(trimmedAcc)) {
                    invalidAccounts.add(trimmedAcc);
                }
                return trimmedAcc;
            }
        );

        if(invalidAccounts.size > 0) {
            throw "" + [...invalidAccounts];
        }

        for (i=0; i < accountsArray.length; i++) {
            if (validAccounts.has(accountsArray[i])) {
                console.log("     > Warning: Duplicate address: " + accountsArray[i]);
            } else {
                validAccounts.add(accountsArray[i]);
            }
        }

        if (validAccounts.size > 0) {
            return [...validAccounts];
        }    
    }
    
    return [];
}

module.exports = {
    enodeToParams,
    isInitialAdminAccountsAvailable,
    isInitialAllowlistedAccountsAvailable,
    isInitialAllowlistedNodesAvailable,
    getInitialAdminAccounts,
    getInitialAllowlistedAccounts,
    getInitialAllowlistedNodes
 }