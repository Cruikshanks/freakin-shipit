const path = require('path')

module.exports = function (shipit) {
  require('shipit-deploy')(shipit)
  require('shipit-npm')(shipit)

  shipit.initConfig({
    default: {
      // path to an empty directory where Shipit builds it's syncing source.
      // Beware to not set this path to the root of your repository as
      // shipit-deploy cleans the directory at the given path as a first step.
      workspace: '/tmp/workspace',
      // path where the project will be deployed. A directory `releases` is
      // automatically created. A symlink current is linked to the current
      // release
      deployTo: '/srv/freakin-hapi-app',
      // Git URL of the project repository
      repositoryUrl: 'https://github.com/Cruikshanks/freakin-hapi-app.git',
      // Tag, branch or commit to deploy
      branch: 'master',
      // An array of paths that match ignored files. These paths are used in the
      // rsync command
      ignores: [
        '.git',
        'node_modules',
        'test',
        '.codeclimate.yml',
        '.env.example',
        '.gitignore',
        '.htmlhintrc',
        'LICENSE',
        'Procfile',
        '.travis.yml'
      ],
      // Arguments to pass to rsync https://en.wikipedia.org/wiki/Rsync which is
      // used to transfer the files between the temp workspace and the release
      // folder.
      rsync: ['--del'],
      // Number of releases to keep on the remote server
      keepReleases: 5,
      // Whether or not to delete the old release when rolling back to a
      // previous release
      deleteOnRollback: false,
      // Perform a shallow clone (clone repository with history truncated to a
      // particular depth rather than getting everything)
      shallowClone: true
    },
    vagrant: {
      // Servers on which the project will be deployed. Pattern must be
      // user@myserver.com If user is not specified (myserver.com) the default
      // user will be "deploy"
      servers: 'vagrant@10.20.30.2',
      // We need to change the folder we deploy to on the vagrant box to one the
      // vagrant user has permissions for
      deployTo: '/home/vagrant/freakin-hapi-app',
      key: '.vagrant/machines/default/virtualbox/private_key'
    }
  })

  // Tasks

  shipit.task('reload', function () {
    shipit.remote(`pm2 reload freakin-hapi-app --update-env`)
      .then(function (results) {
        shipit.emit('reloaded')
      })
      .catch(function (error) {
        shipit.log(error)
        shipit.emit('not-started')
      })
  })

  shipit.task('start', function () {
    shipit.remote(`pm2 start ${path.join(shipit.currentPath, 'server.js')} --name freakin-hapi-app`)
    shipit.emit('started')
  })

  // Event listeners

  shipit.on('deployed', function () {
    shipit.start('reload')
  })

  shipit.on('not-started', function () {
    shipit.start('start')
  })
}
