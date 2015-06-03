var assert = require('assert'),
    path = require('path'),
    fs = require('fs'),
    NetRC = require('..').NetRC;

describe('netrc', function () {

  var netrc,
      inputFilename,
      emptyFilename,
      outputFilename;

  beforeEach(function () {
    netrc = new NetRC();
    inputFilename = path.join(__dirname, '.netrc');
    outputFilename = path.join(__dirname, '.netrc-modified');
    emptyFilename = path.join(__dirname, '.netrc-empty');
    fs.writeFileSync(outputFilename, fs.readFileSync(inputFilename, { encoding: 'utf8' }));
  });

  it("changes the default filename", function () {
    assert.equal(netrc.filename, process.env.HOME + "/.netrc");

    netrc.file(inputFilename);

    assert.equal(netrc.filename, inputFilename);
  });

  it("reads the .netrc file", function () {
    netrc.file(inputFilename);

    assert.equal(netrc.host("code.example.com").login, "alice@code.example.com");
    assert.equal(netrc.host("code.example.com").password, "86801bc8abbffd7fa4f203329ba55c4043f4db78");
    assert.equal(netrc.host("api.example.com").login, "alice@api.example.com");
    assert.equal(netrc.host("api.example.com").password, "86802bc8abbffd7fa4f203329ba55c4043f4db78");
    assert.equal(netrc.host("git.example.com").login, "alice@git.example.com");
    assert.equal(netrc.host("git.example.com").password, "86803bc8abbffd7fa4f203329ba55c4043f4db78");

    netrc.file(emptyFilename);
    netrc.read();
    assert.deepEqual(netrc.machines, {});
  });

  it("knows if a machine is in the .netrc", function () {
    netrc.file(inputFilename);

    assert.equal(netrc.hasHost("code.example.com"), true);
    assert.equal(netrc.hasHost("blarg.com"), false);
  });

  it("adds a machine to the .netrc representation", function () {
    netrc.file(inputFilename);

    netrc.addMachine("new.example.com", {
      login: "alice@new.example.com",
      password: "p@ssword"
    });

    assert.equal(netrc.host("new.example.com").login, "alice@new.example.com");
    assert.equal(netrc.host("new.example.com").password, "p@ssword");
  });

  it("writes the .netrc file", function () {
    netrc.file(inputFilename);
    netrc.read();

    netrc.file(outputFilename);
    netrc.write();

    assert.equal(fs.readFileSync(outputFilename, { encoding: 'utf8' }), fs.readFileSync(inputFilename, { encoding: 'utf8' }));
  });

  it("modifies and writes the .netrc file", function () {
    netrc.file(inputFilename);

    var original = fs.readFileSync(inputFilename, { encoding: 'utf8' }),
        modified = original +
          "\nmachine new.example.com\n" +
          "  login alice@new.example.com\n" +
          "  password p@ssword";

    netrc.addMachine("new.example.com", {
      login: "alice@new.example.com",
      password: "p@ssword"
    });

    netrc.file(outputFilename);
    netrc.write();

    assert.equal(fs.readFileSync(outputFilename, { encoding: 'utf8' }), modified);
  });

  it("modifies and writes originally empty .netrc file", function () {
    netrc.file(emptyFilename);
    netrc.read();

    var original = '',
        modified = original +
          "machine new.example.com\n" +
          "  login alice@new.example.com\n" +
          "  password p@ssword";

    netrc.addMachine("new.example.com", {
      login: "alice@new.example.com",
      password: "p@ssword"
    });

    netrc.file(outputFilename);
    netrc.write();

    assert.equal(fs.readFileSync(outputFilename, { encoding: 'utf8' }), modified);
  });

});
