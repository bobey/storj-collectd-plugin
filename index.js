#!/usr/bin/env node

'use strict';

const dnode = require('dnode');
const host = process.env.COLLECTD_HOSTNAME || 'storj.node';
const interval = process.env.COLLECTD_INTERVAL || 120;
const storjDaemonPort = 45015;

const outputCollectdData = (share) => {
    const totalPeers = share.meta.farmerState.totalPeers || 0;
    const numRestarts = share.meta.numRestarts || 0;
    const spaceUsedBytes = share.meta.farmerState.spaceUsedBytes || 0;
    const contractCount = share.meta.farmerState.contractCount || 0;
    const delta = fixDeltaValue(share);
    const percentUsed = share.meta.farmerState.percentUsed || 0;

    console.log(`PUTVAL ${host}/storj/peers-${share.id} interval=${interval} N:${totalPeers}`);
    console.log(`PUTVAL ${host}/storj/restarts-${share.id} interval=${interval} N:${numRestarts}`);
    console.log(`PUTVAL ${host}/storj/shared-${share.id} interval=${interval} N:${spaceUsedBytes}`);
    console.log(`PUTVAL ${host}/storj/contracts-${share.id} interval=${interval} N:${contractCount}`);
    console.log(`PUTVAL ${host}/storj/delta-${share.id} interval=${interval} N:${delta}`);
    console.log(`PUTVAL ${host}/storj/percentused-${share.id} interval=${interval} N:${percentUsed}`);
};

const fixDeltaValue = (share) => {
    let delta = share.meta.farmerState.ntpStatus.delta;

    if (!delta) {
        return 0;
    }

    return parseInt(delta.replace('ms', ''), 10);
};

const status = () => {

    const sock = dnode.connect(storjDaemonPort);

    sock.on('error', function() {
        console.error('Daemon is not running');
    });

    sock.on('remote', (rpc) => {

        rpc.status((err, shares) => {

            shares.forEach(outputCollectdData);

            sock.end();
        });
    });
};

setInterval(status, interval * 1000);
