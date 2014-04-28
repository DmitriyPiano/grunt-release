var grunt = require('grunt');
var semver = require('semver');

module.exports = {

  bump: function(config) {
    var newVersion = semver.inc(config.pkg.version, config.type);
    config.pkg.version = newVersion;
    //config.templateOptions.data.version = newVersion;
    grunt.file.write(config.file, JSON.stringify(config.pkg, null, '  ') + '\n');
    config.filesToCommit.push(config.file);
    return {
      msg: 'Version bumped to ' + newVersion
    }
  },

  add: function(config) {
    return this._addFile(config.file);
  },

  _addFile: function(file) {
    return {
      cmd: 'git add ' + file,
      msg: 'added ' + file
    };
  },

  _processTemplate: function(type, config) {
    return grunt.template.process(config[type], {data: { version: config.pkg.version}})
  },

  commit: function(config) {
    var message = this._processTemplate('commitMessage', config);

    return {
      cmd: 'git commit ' + config.filesToCommit.join(' ') + ' -m "' + message + '"',
      msg: config.filesToCommit.join(', ') + ' committed'
    }
  },

  tag: function(config) {
    var name = this._processTemplate('tagName', config);
    var message = this._processTemplate('tagMessage', config);

    return {
      cmd: 'git tag ' + name + ' -m "' + message + '"',
      msg: 'New git tag created: ' + name
    };
  },

  push: function() {
    return {
      cmd: 'git push',
      msg: 'pushed to remote'
    };
  },

  pushTags: function(config) {
    var name = this._processTemplate('tagName', config);
    return {
      cmd: 'git push --tags',
      msg: 'pushed new tag ' + name + ' to remote'
    };
  },


  customTasks: function(config) {
    var filesToAdd = [];
    config.customTasks.forEach(function(task) {
      var files = task.files;
      var func = task.process;

      files.forEach(function(file) {
        var fileContent = grunt.file.read(file);
        var newFileConent = func(fileContent, config.oldVersion, config.pkg.version);
        grunt.file.write(file, newFileConent);
        this._addFile(file);
        config.filesToCommit.push(file);
        filesToAdd.push(file);
      }, this)
    }, this);

    return this._addFile(filesToAdd.join(' '));
  }
};
