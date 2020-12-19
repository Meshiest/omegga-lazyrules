const fs = require('fs');
const path = require('path');

const RULES_FILE = path.join(__dirname, 'RULES.txt');


class LazyRules {
  // the constructor also contains an omegga if you don't want to use the global one
  // config and store variables are optional but provide access to the plugin data store
  constructor(omegga, config, store) {
    this.omegga = omegga;
    this.config = config;
    this.store = store;

    // read the rules file and remove blank lines
    console.info('Reading rules from file', RULES_FILE);
    this.rules = fs.readFileSync(RULES_FILE).toString()
      .split('\n')
      .filter(l => l);
  }

  // show the rules to a player
  showRules(player) {
    for (const rule of this.rules) {
      Omegga.whisper(player, '"' + rule.replace(/\$1/g, player.name).replace(/"/g, '\\"') + '"');
    }
  }

  // determine if it's the first time a player has joined the server
  async isFirstJoin(id) {
    // get the players who have joined
    const joins = (await this.store.get('joins')) || [];

    let joined = false;
    // check if they are in that list
    if (joins.includes(id)) {
      joined = true;
    } else {
      // otherwise add them and update the list
      joins.push(id);
      await this.store.set('joins', joins);
    }

    // if they haven't joined yet, it's their first time!
    return !joined;
  }

  async init() {
    Omegga
      .on('chatcmd:rules:reset', async (name) => {
        if (!Omegga.getPlayer(name).isHost()) return;
        await this.store.wipe();
        Omegga.broadcast('"Cleared record for first joins"');
      })
      .on('chatcmd:rules', name => {
        const player = Omegga.getPlayer(name);
        if (player) this.showRules(player);
      });

    // determine of rules should be display on join
    if (this.config['on-join'])
      Omegga.on('join', async player => {
        try {
          if (!this.config['only-first-join'] || await this.isFirstJoin(player.id)) {
            this.showRules(player);
          }
        } catch (err) {
          console.error('Error displaying rules', err);
        }
      });
  }

  async stop() {}
}

module.exports = LazyRules;