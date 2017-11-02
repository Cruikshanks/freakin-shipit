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

  // Verify the contents of the cache folder, garbage collecting any unneeded
  // data, and verifying the integrity of the cache index and all cached data.
  // Added to help try and prevent errors like this
  // WARN registry Unexpected warning for https://registry.npmjs.org/: Miscellaneous Warning EINTEGRITY: sha512-Pbeh0i6OLubPJdIdCepn8ZQHwN2MWznZHbHABSTEfQ706ie+yuxNSaPdqX1xRatT6WanaS1EazMiSg0NUW2XxQ== integrity checksum failed when using sha512: wanted sha512-Pbeh0i6OLubPJdIdCepn8ZQHwN2MWznZHbHABSTEfQ706ie+yuxNSaPdqX1xRatT6WanaS1EazMiSg0NUW2XxQ== but got sha1-Nq/u4Nk0XwRjh85t6KZwKv5btW4=. (2915 bytes)
  // WARN registry Using stale package data from https://registry.npmjs.org/ due to a request error during revalidation.
  shipit.task('npm-verify', () => {
    shipit.remote('npm cache verify')
    shipit.emit('npm-verified')
  })

  // The only way pm2 can support capistrano like deployments is if a config
  // file is used rather than calling the app directly.
  // http://pm2.keymetrics.io/docs/tutorials/capistrano-like-deployments
  //
  // This is because of the use of a symlinked 'current' directory which is
  // pointed to a seperate release folder. If you call your server.js script
  // directly using pm2 within the project root, it won't pick up that 'current'
  // has been repointed on subsequent deployments.
  //
  // The way to resolve this is to call pm2 passing in a config file instead,
  // and in that specify the start script and the current working directory
  // for pm2.
  //
  // We therefore use shipit to copy across our pm2 config to the instance(s)
  // ready to be refereneced in the start task
  shipit.task('deploy-pm2-config', () => {
    const pm2ConfigFilepath = path.join(shipit.config.deployTo, 'pm2.json')
    shipit.remoteCopy('pm2.json', pm2ConfigFilepath)
      .then(() => {
        shipit.emit('deployed-pm2-config')
      })
      .catch((error) => {
        shipit.log(error)
        shipit.emit('deploy-pm2-config-failed')
      })
  })

  shipit.task('reload', () => {
    shipit.remote(`pm2 reload freakin-hapi-app --update-env`)
      .then(function (results) {
        shipit.emit('reloaded')
      })
      .catch(function (error) {
        shipit.log(error)
        shipit.emit('not-started')
      })
  })

  shipit.task('start', () => {
    shipit.remote(`cd ${shipit.config.deployTo} && pm2 start pm2.json`)
    shipit.emit('started')
  })

  // Event listeners

  // Event emitted by shipit at the very start when it kicks off the deployment
  shipit.on('deploy', () => {
    shipit.start('npm-verify')
  })

  // Event emitted by shipit once it has finished all its tasks
  shipit.on('deployed', () => {
    shipit.start('deploy-pm2-config')
  })

  // Emitted once the pm2 config file has been copied to the instance. Once it
  // has its safe to call `reload()`
  shipit.on('deployed-pm2-config', () => {
    shipit.start('reload')
  })

  // Event we emit if `reload()` fails, which is expected the first time we
  // run the deployment
  shipit.on('not-started', () => {
    shipit.start('start')
  })
}
