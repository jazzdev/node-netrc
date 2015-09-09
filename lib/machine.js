function Machine(index) {
    this.index = index || 0;
    this.machine = null;
    this.login = null;
    this.password = null;
    this.account = null;
    this.macdef = null;
}

Machine.prototype.output = function () {
  var machine = this;
  var lines = ["machine " + this.machine];

  ['login', 'password', 'account', 'macdef'].forEach(function (key) {
      if(machine[key])
          lines.push("  " + key + " " + machine[key]);
  });

  return lines.join('\n');
};

module.exports = Machine;
