function NetRCError (message, code) {
    this.name = 'NetRCError';
    this.message = message || ".netrc Error";
    this.code = code || 'NONE';
    this.stack = (new Error()).stack;
}

NetRCError.prototype = Object.create(Error.prototype);
NetRCError.prototype.constructor = NetRCError;

module.exports = NetRCError;
