#!/usr/bin/env node

'use strict';

const dnode = require('dnode');
const host = process.env.COLLECTD_HOSTNAME || 'storj.node';
const interval = process.env.COLLECTD_INTERVAL || 120;
const storjDaemonPort = 45015;

const apiHost = "api.storj.io";
const apiURI = "/contacts/";

const outputCollectdData = (share) => {
    const totalPeers = share.meta.farmerState.totalPeers || 0;
    const numRestarts = share.meta.numRestarts || 0;
    const spaceUsedBytes = share.meta.farmerState.spaceUsedBytes || 0;
    const contractCount = share.meta.farmerState.contractCount || 0;
    const delta = fixDeltaValue(share);
    const percentUsed = share.meta.farmerState.percentUsed || 0;
    const dataReceivedCount = share.meta.farmerState.dataReceivedCount || 0;

    console.log(`PUTVAL ${host}/storj/peers-${share.id} interval=${interval} N:${totalPeers}`);
    console.log(`PUTVAL ${host}/storj/restarts-${share.id} interval=${interval} N:${numRestarts}`);
    console.log(`PUTVAL ${host}/storj/shared-${share.id} interval=${interval} N:${spaceUsedBytes}`);
    console.log(`PUTVAL ${host}/storj/contracts-${share.id} interval=${interval} N:${contractCount}`);
    console.log(`PUTVAL ${host}/storj/delta-${share.id} interval=${interval} N:${delta}`);
    console.log(`PUTVAL ${host}/storj/percentused-${share.id} interval=${interval} N:${percentUsed}`);
    console.log(`PUTVAL ${host}/storj/datareceived-${share.id} interval=${interval} N:${dataReceivedCount}`);
};

const fixDeltaValue = (share) => {
    let delta = share.meta.farmerState.ntpStatus.delta;

    if (!delta) {
        return 0;
    }

    return parseInt(delta.replace('ms', ''), 10);
};

const deliverAPIdata = (share) => {
    const node_id = share.id;
    var options = {
        host: apiHost,
        path: apiURI+node_id
    };

    var req = https.get(options, (res) => {
        if (res.statusCode !== 200) return;

        var bodyChunks = [];
        res.on('data', (chunk) => {
            bodyChunks.push(chunk);
        }).on('end', () => {
            var body = Buffer.concat(bodyChunks);
            var obj = JSON.parse(body);

            outputAPIdata(obj);
        });
    });

    req.on('error', function(err) {

    });

    req.end();

};

const outputAPIdata = (data) => {
    const respTime = data.responseTime || 0;
    const nodeID = data.nodeID || "unknownNode";
    const reputation = data.reputation || 0;
    const timeoutRate = data.timeoutRate || 0;
    const _lastSeen = data.lastSeen || "";
    const _lastTimeout = data.lastTimeout || "";

    var lastSeen = 0, lastTimeout = 0;
    if (_lastSeen !== "") {
        var d = new Date(_lastSeen);
        lastSeen = d.getTime();
    }

    if (_lastTimeout !== "") {
        var d = new Date(_lastTimeout);
        lastTimeout = d.getTime();
    }

    console.log(`PUTVAL ${host}/storj/resptime-${nodeID} interval=${interval} N:${respTime}`);
    console.log(`PUTVAL ${host}/storj/reputation-${nodeID} interval=${interval} N:${reputation}`);
    console.log(`PUTVAL ${host}/storj/timeoutrate-${nodeID} interval=${interval} N:${timeoutRate}`);
    console.log(`PUTVAL ${host}/storj/lastseen-${nodeID} interval=${interval} N:${lastSeen}`);
    console.log(`PUTVAL ${host}/storj/lasttimeout-${nodeID} interval=${interval} N:${lastTimeout}`);
};

const status = () => {

    const sock = dnode.connect(storjDaemonPort);

    sock.on('error', function() {
        console.error('Daemon is not running');
    });

    sock.on('remote', (rpc) => {

        rpc.status((err, shares) => {

            shares.forEach(outputCollectdData);
            shares.forEach(deliverAPIdata);

            sock.end();
        });
    });
};

setInterval(status, interval * 1000);
