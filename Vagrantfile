# -*- mode: ruby -*-
# vi: set ft=ruby :

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.
Vagrant.configure("2") do |config|
  # The most common configuration options are documented and commented below.
  # For a complete reference, please see the online documentation at
  # https://docs.vagrantup.com.

  # Every Vagrant development environment requires a box. You can search for
  # boxes at https://vagrantcloud.com/search.
  config.vm.box = "ubuntu/trusty64"

  # The hostname the machine should have. Defaults to nil. If nil, Vagrant will
  # not manage the hostname. If set to a string, the hostname will be set on
  # boot
  config.vm.hostname = "fha-vagrant"

  if Vagrant.has_plugin?("vagrant-cachier")
    # Configure cached packages to be shared between instances of the same base box.
    # More info on the "Usage" link above
    config.cache.scope = :box
  end

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine. In the example below,
  # accessing "localhost:3003" will access port 300 on the guest machine.
  # NOTE: This will enable public access to the opened port
  config.vm.network "forwarded_port", guest: 3000, host: 3003

  # Create a private network, which allows host-only access to the machine
  # using a specific IP.
  #
  # We specifically make use of a private network in this example as it means
  # we can tell shipit to ssh to this vm, rather than the default 127.0.0.1:2222
  # Not a problem if you will only ever have 1 vagrant vm running on your
  # host, but configuring it this way means we shouldn't ever face an issue if
  # we run multiple vm's.
  #
  # IMPORTANT NOTE! I have found for the private network to take hold you are
  # best to follow the initial `vagrant up` with a `vagrant reload`
  config.vm.network "private_network", ip: "10.20.30.2"

  # General provisioning of the box. Ensure time is set correctly and do an
  # initial apt-get update, plus install packages commonly needed by all boxes
  config.vm.provision "shell", name: "common", inline: <<-SHELL
    timedatectl set-timezone Europe/London
    apt-get update > /dev/null
    apt-get install -y git build-essential tcl8.5 wget curl make libqt4-dev
  SHELL

  # Enable provisioning with a shell script
  config.vm.provision "shell", name: "node-js", inline: <<-SHELL
    curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
    sudo apt-get install -y nodejs

    # Optional build tools to compile and install native addons from npm
    apt-get install -y build-essential
  SHELL

  config.vm.provision "shell", name: "pm2", inline: <<-SHELL
    npm install pm2@latest -g
    pm2 startup
    # Running pm2 startup will output a request to run the following
    env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup upstart -u vagrant --hp /home/vagrant
  SHELL

  config.vm.provision "shell", name: "npm", inline: <<-SHELL
    # Kept getting `Unhandled rejection Error: EPERM: operation not permitted, link `
    # errors when it came to running `npm install` for the deployed app.
    # Upgrading npm seemed to resolve the problem, but when just trying
    # `npm install -g npm` we would get a `cb() never called!` error. So using
    # some info from this post https://github.com/npm/npm/issues/16551 we do
    # the following to get npm upgraded and the app deploying successfully on
    # the vagrant box.
    # N.B. these also require sudo but by default this script will run as
    # priveleged hence we don't specify it
    npm cache clean --force
    rm -rf ~/.npm
    npm install -g npm

    # Found I still hit an issue when trying to run `npm install` for the app
    # for the first time following build. It would only succeed if I had run
    # this before hand (one time operation. )
    rm -rf /home/vagrant/.npm
  SHELL
end
