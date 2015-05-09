/*!
 * netrc
 *
 * Copyright(c) 2012 JD Brennan <jazzdev@gmail.com>
 * MIT License
 */

var fs = require('fs');

exports = module.exports = new NetRC();

function NetRC() {
    this.filename = process.env.HOME + "/.netrc";
    this.machines = null;
    this.comments = {};
}

NetRC.prototype.file = function(filename) {
    this.filename = filename;
};

NetRC.prototype.host = function(hostname) {
    if (this.machines === null) {
        this.read();
    }
    if (!this.machines[hostname]) this.error("Machine " + hostname + " not found in " + this.filename);
    return this.machines[hostname];
};

NetRC.prototype.read = function() {
    if (!fs.existsSync(this.filename)) this.error("File does not exist: " + this.filename);
    this.machines = {};
    var data = fs.readFileSync(this.filename, { encoding: "UTF-8" });

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
    var machine = new Machine();
    var key = null;
    for (var i in tokens) {
        if (!key) {
            key = tokens[i];
            if (key === 'machine') {
                this.machines[machine.machine] = machine;
                machine = new Machine(machine.index + 1);
            }
        } else {
            machine[key] = this.unescape(tokens[i]);
            key = null;
        }
    }
    this.machines[machine.machine] = machine;
};

NetRC.prototype.write = function() {
    if (!fs.existsSync(this.filename)) this.error("File does not exist: " + this.filename);

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
                lines.push("\t " + key + " " + machine[key]);
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
    this.machine = 'empty';
    this.login = null;
    this.password = null;
    this.account = null;
    this.macdef = null;
}

function insertInto(str, ins, at) {
    return [str.slice(0, at), ins, str.slice(at)].join('');
}
