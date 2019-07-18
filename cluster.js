const cluster  = require('cluster');
//const cpuCount = require('os').cpus().length;
//const winston  = require('winston').cli();
const server   = 'server.js';
const STATE_COUNT = 8;

if (cluster.isMaster) {

    // Fork all the machine's cpus
    for (i = 0; i < STATE_COUNT; i++) {
        cluster.fork({state: i});
    }

    // Add cpu number to each workers
    Object.keys(cluster.workers).forEach(function (id) {
        let worker = cluster.workers[id];
        worker.cpu_number = --id;
    });
    
} else {
    console.log(cluster.worker.id - 1);
    require(__dirname + '/' + server)(cluster.worker.id - 1);
} 

// Listen for dying workers
cluster.on('exit', function(worker, code, signal) {
    let state      = worker.state;

    console.log('Worker ' + worker.process.pid + ' died with state: ' + state);
    console.log('Starting a new worker');
    cluster.fork({state: state}).on('online', () => {

        let workers  = cluster.workers,
        keys         = Object.keys(workers);
        
        // Get the last element of cluster workers 
        // and assign its cpu number
        workers[ keys[ keys.length - 1 ] ].cpu_number = cpu;

    });
});