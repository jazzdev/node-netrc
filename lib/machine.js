function Machine(index) {
    this.index = index || 0;
    this.machine = null;
    this.login = null;
    this.password = null;
    this.account = null;
    this.macdef = null;
}

module.exports = Machine;
