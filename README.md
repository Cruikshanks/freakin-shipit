# Freakin shipit

## Pre-requisites

You'll need the following to be able to build and run the project

- [Node V8*](https://nodejs.org/en/download/current/)

## Installation

First clone the repository

```bash
git clone https://github.com/Cruikshanks/freakin-shipit.git && cd freakin-shipit
```

Then install the dependencies

```bash
npm install
```

## Creating the environments

In order to demonstrate **Freakin shipit** working we need some environments to deploy our app to. Currently the following are available but they will need to be created first before you can deploy to them.

### Vagrant

You'll need the following to build this environment

- [VirtualBox](https://www.virtualbox.org/)
- [Vagrant](https://www.vagrantup.com/)

It's also recommended you install the plugin [Vagrant Cachier plugin](https://github.com/fgrehm/vagrant-cachier). This will accelerate the provisioning of new vagrant machines.

Navigate to the root of the project in your terminal and run `vagrant up` to create the virtual machine.

Once complete run `vagrant reload`. This may not always be necessary but it appears to solve issues with configuring the vagrant box to use a private network and it not working until the box is restarted.

#### Error with npm install

When working with Vagrant and npm I tend experience the error `Unhandled rejection Error: EPERM: operation not permitted` errors frequently.

I have never found a solution that I can automate so to avoid errors, having restarted the virtual machine do the following from the root of the project

```bash
ssh -i .vagrant/machines/default/virtualbox/private_key vagrant@10.20.30.2
rm -rf /home/vagrant/.npm
```

You only need to do this once.

We use **ssh** itself rather than the `vagrant ssh` command as a way of double checking we can connect via this method (as that's what **shipit** will use).

Then once into the machine we delete the `.npm` folder at the root of the user. This seems to prevent the error from occurring on our first and all subsequent deployments.

#### Deploying

To deploy to the Vagrant machine run

```bash
npm start vagrant deploy
```

You can check the app is up and running from the host by going to <http://10.20.30.2:3000>.

Access the environment using `vagrant ssh`.

## General workflow

The way this works is **Shipit** is ssh'ing to the target machine and running commands remotely. The first thing it does is clone the targetted repo to the `workspace`. Once down it will create a release folder and copy the files into it ignoring those listed in your config.

Whilst doing this our custom task `npm-verify()` will be called to verify the contents of the npm cache folder as a preventitive to issues with `npm -i`.

The add-on [shipit-npm](https://github.com/callerc1/shipit-npm) then kicks in and runs `npm -i` to install your dependencies. **Shipit** will then create a symlink between the `current` folder and the newly created folder in `releases`.

Finally it finishes with some clean up, deleting the workspace folder plus any old release folders, after which it emits the event `deployed`.

This is when the custom tasks in `shipitfile.js` are called. In our case we

- Copy `pm2.config` from the deployment server to the target server, into the root deployment folder. We have to start the app with a **pm2** config file in order to support [Capistrano like deployments](http://pm2.keymetrics.io/docs/tutorials/capistrano-like-deployments)
- Attempt to reload the app via [pm2](http://pm2.keymetrics.io/)
- If that errors, we assume its because we have not started the app so instead tell **pm2** to do so

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/cruikshanks/freakin-shipit.

## License

The gem is available as open source under the terms of the [MIT License](http://opensource.org/licenses/MIT).

> If you don't add a license it's neither free or open!
