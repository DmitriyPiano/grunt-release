var shell = require('shelljs');
var tasks = require('./lib/tasks.js');

module.exports = function(grunt) {
  grunt.registerTask('release', 'bump version, git tag, git push', function(type) {
      //defaults
      var options = this.options({
        bump: true,
        file: grunt.config('pkgFile') || 'package.json',
        add: true,
        commit: true,
        tag: true,
        push: true,
        pushTags: true
      });

      var config = setup(options, type);

      ['bump', 'add', 'customTasks', 'commit', 'tag', 'push', 'pushTags'].forEach(run.bind(tasks, config));


      function setup(options, type) {
        var file = options.file;
        var pkg = grunt.file.readJSON(file);

        return {
          type: type || 'patch',
          file: file,
          pkg: pkg,
          oldVersion: pkg.version,
          customTasks: options.customTasks,
          tagName: grunt.config.getRaw('release.options.tagName') || '<%= version %>',
          commitMessage: grunt.config.getRaw('release.options.commitMessage') || 'release <%= version %>',
          tagMessage: grunt.config.getRaw('release.options.tagMessage') || 'version <%= version %>',
          filesToCommit: []
        }
      }

      function run(config, task) {
        if (!options[task]) {
          return;
        }
        var r = this[task](config);
        if (!r) {
          return;
        }

        if (r.cmd)shell.exec(r.cmd, {silent: true});
        if (r.msg) grunt.log.ok(r.msg);
      }
    }

  )
  ;
};
