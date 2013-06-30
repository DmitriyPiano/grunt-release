var buster = require('buster');
var grunt = require('grunt');
var tasks = require('../tasks/lib/tasks');

buster.spec.expose();

buster.testCase("release", {

  setUp: function() {
    this.config = {
      type: 'patch',
      file: 'test/fixtures/package.json',
      pkg: {
        "version": "0.0.12"
      },
      oldVersion: '0.0.12',
      customTasks: [
        {
          files: ['test/fixtures/file1.txt'],
          process: function(content, oldVersion, newVersion) {
            return content.replace(oldVersion, newVersion);
          }
        },
        {
          files: ['test/fixtures/file2.txt'],
          process: function(content, oldVersion, newVersion) {
            return content.replace(oldVersion, newVersion + '_test');
          }
        }
      ],
      tagName: '<%= version %>',
      commitMessage: 'release <%= version %>',
      tagMessage: 'version <%= version %>',
      filesToCommit: [],
      templateOptions: {
        data: {
          version: '0.0.12'
        }
      }
    }
  },

  'bumps the': {

    setUp: function() {
      this.stub(grunt.file, 'write');
    },

    'patch version': function() {
      var bump = tasks.bump(this.config);

      expect(grunt.file.write).toHaveBeenCalledWith(
        'test/fixtures/package.json',
        JSON.stringify({'version': '0.0.13'}, null, '  ') + '\n'
      );
      expect(bump.msg).toEqual('Version bumped to 0.0.13');
    },

    'minor version': function() {
      this.config.type = 'minor';
      var bump = tasks.bump(this.config);

      expect(grunt.file.write).toHaveBeenCalledWith(
        'test/fixtures/package.json',
        JSON.stringify({'version': '0.1.0'}, null, '  ') + '\n'
      );
      expect(bump.msg).toEqual('Version bumped to 0.1.0')
    },

    'major version': function() {
      this.config.type = 'major';
      var bump = tasks.bump(this.config);

      expect(grunt.file.write).toHaveBeenCalledWith(
        'test/fixtures/package.json',
        JSON.stringify({'version': '1.0.0'}, null, '  ') + '\n'
      );
      expect(bump.msg).toEqual('Version bumped to 1.0.0')
    }
  },

  'adds package file to git': function() {
    var add = tasks.add(this.config);
    expect(add.cmd).toEqual('git add test/fixtures/package.json');
    expect(add.msg).toEqual('added test/fixtures/package.json');
  },

  'commits the changed files to git': function() {
    this.config.filesToCommit = ['fileA' , 'fileB', 'fileC'];
    var commit = tasks.commit(this.config);
    expect(commit.cmd).toEqual('git commit fileA fileB fileC -m "release 0.0.12"');
    expect(commit.msg).toEqual('fileA, fileB, fileC committed');
  },

  'create tag': function() {
    var tag = tasks.tag(this.config);
    expect(tag.cmd).toEqual('git tag 0.0.12 -m "version 0.0.12"');
    expect(tag.msg).toEqual('New git tag created: 0.0.12');
  },

  'push to remote': function() {
    var push = tasks.push(this.config);
    expect(push.cmd).toEqual('git push');
    expect(push.msg).toEqual('pushed to remote');
  },

  'push tag': function() {
    var push = tasks.pushTags(this.config);
    expect(push.cmd).toEqual('git push --tags');
    expect(push.msg).toEqual('pushed new tag 0.0.12 to remote');
  },

  'process custom tasks': {

    setUp: function() {
      this.stub(grunt.file, 'write');
      this.config.pkg.version = '0.0.13';
      this.customTasks = tasks.customTasks(this.config);
    },

    'will replace the file with the result of the custom task': function() {
      expect(grunt.file.write).toHaveBeenCalledWith(
        'test/fixtures/file1.txt',
        'test 0.0.13 test'
      );

      expect(grunt.file.write).toHaveBeenCalledWith(
        'test/fixtures/file2.txt',
        'test 0.0.13_test test'
      );
    },

    'adds the files to git': function() {
      expect(this.customTasks.cmd).toEqual('git add test/fixtures/file1.txt test/fixtures/file2.txt');
      expect(this.customTasks.msg).toEqual('added test/fixtures/file1.txt test/fixtures/file2.txt');
    },

    'adds processed files to files to commit': function() {
      expect(this.config.filesToCommit).toEqual(['test/fixtures/file1.txt', 'test/fixtures/file2.txt'])
    }
  }
});