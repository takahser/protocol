require('dotenv').config()
import {network, patract} from "redspot";
const fs = require('fs');
const {getContractFactory, getRandomSigner, buildTx} = patract;
const {createSigner, keyring, api, getAddresses} = network;

// config
const SECRETS_FILE = '../deployer.json'

async function run() {
    await api.isReady;

    // The redspot signer supports passing in an address. If you want to use  substrate uri, you can do it like this:
    // const signer = createSigner(keyring.createFromUri("bottom drive obey lake curtain smoke basket hold race lonely fit walk//Alice"));
    // Or get the configured account from redspot config:
    // const signer = (await getSigners())[0]
    const signerAddresses = await getAddresses();
    const Alice = signerAddresses[0];
    const alicePair = keyring.getPair(Alice);
    const AliceBalance = await api.query.system.account(Alice);
    console.log("Alice Address:", Alice);
    console.log("Alice Balance: ", AliceBalance.data.free.toHuman());
    const mnemonic = process.env.DEPLOYER_MNEMONIC;
    console.log(mnemonic)
    const keyringPair = network.keyring.addFromMnemonic(mnemonic!);
    const deployer = network.createSigner(keyringPair);
    const balance = await api.query.system.account(deployer.address);
    console.log("Deployer Address:", deployer.address);
    console.log("Deployer Balance: ", balance.data.free.toHuman());
    // send the deployer some tokens to deploy with
    if (balance.data.free.toNumber() === 0) {
        await buildTx(
            api.registry,
            api.tx.balances.transfer(keyringPair.address, 1e15),
            Alice
        );
    }

    const contractFactory = await getContractFactory("prosopo", deployer.address);

    // The `deploy` method will attempt to deploy a new contract.
    // The `deployed` method will first find out if the same contract already exists based on the parameters.
    // If the contract exists, it will be returned, otherwise a new contract will be created.
    // const contract = await contractFactory.deploy("default", deployer.address);

    const contract = await contractFactory.deployed("default", deployer.address, {
        gasLimit: "400000000000",
        value: 4e14,
        salt: "0x01",
        name: "prosopo"
    });

    console.log("");
    console.log(
        "Deploy successfully. The contract address: ",
        contract.address.toString()
    );

    api.disconnect();

    process.exit()
}


run().catch((err) => {
    console.log(err);

});