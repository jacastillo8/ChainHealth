const shim = require('fabric-shim');

var Chaincode = class {

    async Init(stub) {
        return shim.success();
    }

    async Invoke(stub) {
        try {
            const ret = stub.getFunctionAndParameters();
            const method = this[ret.fcn];
            if (method === undefined) throw Error('Method does not exists');
            let payload = await method(stub, ret.params);
            return shim.success(payload);
        } catch (err) {
            return shim.error(err);
        }
    }

    async query(stub, args) {
        const type = JSON.parse(args[0]).type;
        const range = JSON.parse(args[0]).range;

        const results = []
        for (let i=0; i < range.length; i++) {
            const value = await stub.getState(type + range[i]);
            results.push(JSON.parse(value));
        }
        return Buffer.from(JSON.stringify(results));
    }

    async queryAllTypes(stub, args) {
        const types = JSON.parse(args[0]).types; //types object
        const ranges = JSON.parse(args[0]).ranges; // arrays inside object (dependent on type)

        const results = [];
        for (let i=0; i < types.length; i++) {
            for (let j=0; j < ranges[types[i]].length; j++) {
                const value = await stub.getState(types[i] + ranges[types[i]][j]);
                results.push(JSON.parse(value));
            }
        }
        return Buffer.from(JSON.stringify(results));
    }

    async addTX(stub, args) {
        const msgNo = JSON.parse(args[0]).id;
        const type = JSON.parse(args[0]).type;
        const tx = {
            timestamp: Date.now(),
            data: JSON.parse(args[1])
        };
        await stub.putState(`${type}${msgNo}`, Buffer.from(JSON.stringify(tx)));

        return Buffer.from(JSON.stringify({ key: `${type}_${msgNo}` }));
    }
}

shim.start(new Chaincode());