var fs = require('fs'),
    path = require('path');

exports = module.exports = new NetRC();
module.exports.NetRC = NetRC;

function NetRC() {
    this.filename = path.join(process.env.HOME, ".netrc");
    this.machines = null;
    this.comments = {};
}

NetRC.prototype.file = function(filename) {
    this.filename = filename;
};

NetRC.prototype.host = function(hostname) {
    if(!this.hasHost(hostname)) this.error("Machine " + hostname + " not found in " + this.filename);
    return this.machines[hostname];
};

NetRC.prototype.hasHost = function (hostname) {
    if (this.machines === null) {
        this.read();
    }
    return !!this.machines[hostname]
};

NetRC.prototype.read = function() {
    if (!fs.existsSync(this.filename)) this.error("File does not exist: " + this.filename);
    this.machines = {};
    var data = fs.readFileSync(this.filename, { encoding: 'utf8' });

    // Remove comments
    var lines = data.split('\n');
    for (var n in lines) {
        var i = lines[n].indexOf('#');
        if (i > -1) {
            this.comments[n] = {};
            this.comments[n][i] = lines[n].substring(i);
            lines[n] = lines[n].substring(0,i);
        }
    }
    data = lines.join('\n');

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
            machine[key] = this.unescape(tokens[i]);
            key = null;
        }
    }
    this.machines[machine.machine] = machine;
};

NetRC.prototype.write = function() {
    var data = "",
        lines = [],
        machines = [];

    for(var key in this.machines) {
        machines[this.machines[key].index] = this.machines[key];
    }

    machines.forEach(function (machine) {
        lines.push("machine " + machine.machine);
        ['login', 'password', 'account', 'macdef'].forEach(function (key) {
            if(machine[key])
                lines.push("  " + key + " " + machine[key]);
        });
    });

    for(var lineNumber in this.comments) {
        for(var charNumber in this.comments[lineNumber]) {
            lines[lineNumber] = insertInto(lines[lineNumber], this.comments[lineNumber][charNumber], charNumber);
        }
    }

    data = lines.join('\n');

    fs.writeFileSync(this.filename, data);
};

NetRC.prototype.addMachine = function (hostname, options) {
    if (this.machines === null) {
        this.read();
    }

    var self = this,
        maxIndex = Math.max.apply(null, Object.keys(this.machines).map(function (key) {
            return self.machines[key].index;
        })) || 0,
        machine;

    if (this.machines[hostname]) this.error("Machine " + hostname + " already exists in " + this.filename);

    machine = new Machine(maxIndex + 1);

    machine.machine = hostname;

    for(var key in options) {
        machine[key] = options[key];
    }

    this.machines[machine.machine] = machine;
};

// Allow spaces and other weird characters in passwords by supporting \xHH
NetRC.prototype.unescape = function(s) {
    var match = /\\x([0-9a-fA-F]{2})/.exec(s);
    if (match) {
        s = s.substr(0,match.index) +
            String.fromCharCode(parseInt(match[1], 16)) +
            s.substr(match.index+4);
    }
    return s;
};

NetRC.prototype.error = function(message) {
    console.error("netrc: Error:", message);
    process.exit(1);
};

function Machine(index) {
    this.index = index || 0;
    this.machine = null;
    this.login = null;
    this.password = null;
    this.account = null;
    this.macdef = null;
}

function insertInto(str, ins, at) {
    return [str.slice(0, at), ins, str.slice(at)].join('');
}
