var fs = require('fs'),
    path = require('path'),
    NetRCError = require('./lib/netrc-error'),
    Machine = require('./lib/machine');

exports = module.exports = new NetRC();
module.exports.NetRC = NetRC;

function NetRC(filename) {
    this.filename = filename || path.join(process.env.HOME, ".netrc");
    this.machines = null;
    this.comments = {};
}

NetRC.prototype.host = function (hostname) {
    if(!this.hasHost(hostname)) throw new NetRCError("Machine " + hostname + " not found in " + this.filename, 'NOMACHINE');
    return this.machines[hostname];
};

NetRC.prototype.hasHost = function (hostname) {
    if (this.machines === null) {
        this.read();
    }
    return !!this.machines[hostname];
};

NetRC.prototype.addHost = function (hostname, options) {
    if (this.machines === null) {
        this.read();
    }

    var self = this,
        maxIndex = Object.keys(self.machines).length || 0,
        machine;

    if (this.machines[hostname]) throw new NetRCError("Machine " + hostname + " already exists in " + this.filename, 'MACHINEEXISTS');

    machine = new Machine(maxIndex + 1);

    machine.machine = hostname;

    for(var key in options) {
        machine[key] = options[key];
    }

    this.machines[machine.machine] = machine;

    return machine;
};

NetRC.prototype.read = function () {
    var data;
    this.machines = {};

    try {
        data = fs.readFileSync(this.filename, { encoding: 'utf8' });
    } catch(e) {
        if(e.code === 'ENOENT') {
            // treat a non-existent file as an empty one
            data = "";
        } else {
            throw new NetRCError(e.message, e.code);
        }
    }

    this.parse(this.stripComments(data));
};

NetRC.prototype.parse = function (data) {
    var tokens = data.split(/[ \t\n\r]+/);
    var machine;
    var key = null;
    var index = 0;
    for (var i in tokens) {
        if (!key) {
            key = tokens[i];
            if (key === 'machine') {
                if (machine) {
                    this.machines[machine.machine] = machine;
                }
                machine = new Machine(index++);
            }
        } else {
            machine[key] = unescape(tokens[i]);
            key = null;
        }
    }
    if (machine && machine.machine) {
        this.machines[machine.machine] = machine;
    }
};

NetRC.prototype.stripComments = function (data) {
    var lines = data.split('\n');

    for (var n in lines) {
        var i = lines[n].indexOf('#');
        if (i > -1) {
            this.comments[n] = {};
            this.comments[n][i] = lines[n].substring(i);
            lines[n] = lines[n].substring(0,i);
        }
    }

    return lines.join('\n');  
};

NetRC.prototype.insertComments = function (data) {
    var lines = data.split('\n');

    for(var lineNumber in this.comments) {
        for(var charNumber in this.comments[lineNumber]) {
            lines[lineNumber] = insertInto(lines[lineNumber], this.comments[lineNumber][charNumber], charNumber);
        }
    }

    return lines.join('\n');
};

NetRC.prototype.write = function () {
    var data = "",
        lines = [],
        machines = [];

    for(var key in this.machines) {
        machines[this.machines[key].index] = this.machines[key];
    }

    machines.forEach(function (machine) {
        lines.push(machine.output());
    });

    data = this.insertComments(lines.join('\n'));

    fs.writeFileSync(this.filename, data);
};

// Allow spaces and other weird characters in passwords by supporting \xHH
function unescape(s) {
    var match = /\\x([0-9a-fA-F]{2})/.exec(s);
    if (match) {
        s = s.substr(0,match.index) +
            String.fromCharCode(parseInt(match[1], 16)) +
            s.substr(match.index+4);
    }
    return s;
}

function insertInto(str, ins, at) {
    return [str.slice(0, at), ins, str.slice(at)].join('');
}
