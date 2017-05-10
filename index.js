#!/usr/bin/env node

'use strict';

const dnode = require('dnode');
const host = process.env.COLLECTD_HOSTNAME || 'storj.node';
const interval = 120; //override default collectd interval to avoid storj-daemon performance issue
const storjDaemonPort = 45015;

const outputCollectdData = (share) => {
    console.log(`PUTVAL ${host}/storj/peers-${share.id} interval=${interval} N:${share.meta.farmerState.totalPeers}`);
    console.log(`PUTVAL ${host}/storj/restarts-${share.id} interval=${interval} N:${share.meta.numRestarts}`);
    console.log(`PUTVAL ${host}/storj/shared-${share.id} interval=${interval} N:${share.meta.farmerState.spaceUsedBytes}`);
};

const status = () => {

    const sock = dnode.connect(storjDaemonPort);

    sock.on('error', function() {
        console.error('Daemon is not running');
        process.exit();
    });

    sock.on('remote', (rpc) => {

        rpc.status((err, shares) => {

            shares.forEach((share) => outputCollectdData);

            sock.end();
        });
    });
};

setInterval(status, interval * 1000);
