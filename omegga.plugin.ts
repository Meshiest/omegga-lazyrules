import OmeggaPlugin, {
  Brick,
  OL,
  OmeggaPlayer,
  PC,
  PS,
  ReadSaveObject,
} from 'omegga';
import fs from 'fs';
import path from 'path';

const RULES_FILE = path.join(__dirname, 'RULES.txt');

const CooldownProvider = (length = 1000) => {
  const lastCommand = {};

  return (name: string) => {
    const now = Date.now();

    const isOk = !lastCommand[name] || lastCommand[name] + length < now;
    if (isOk) {
      lastCommand[name] = now;
    }

    return isOk;
  };
};

type Config = {
  'on-join': boolean;
  'only-first-join': boolean;
  cooldown: number;
};
type Storage = {
  joins: string[];
};

export default class LazyRules implements OmeggaPlugin<Config, Storage> {
  omegga: OL;
  config: PC<Config>;
  store: PS<Storage>;

  cooldown: ReturnType<typeof CooldownProvider>;
  rules: string[];

  // the constructor also contains an omegga if you don't want to use the global one
  // config and store variables are optional but provide access to the plugin data store
  constructor(omegga: OL, config: PC<Config>, store: PS<Storage>) {
    this.omegga = omegga;
    this.config = config;
    this.store = store;

    this.cooldown = CooldownProvider(Math.max(this.config.cooldown, 1) * 1000);

    // read the rules file and remove blank lines
    console.info('Reading rules from file', RULES_FILE);
    this.rules = fs
      .readFileSync(RULES_FILE)
      .toString()
      .split('\n')
      .filter(l => l);
  }

  // show the rules to a player
  showRules(player: OmeggaPlayer) {
    for (const rule of this.rules) {
      Omegga.whisper(
        player,
        '"' + rule.replace(/\$1/g, player.name).replace(/"/g, '\\"') + '"'
      );
    }
  }

  // determine if it's the first time a player has joined the server
  async isFirstJoin(id: string) {
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
    const cmdResetRules = async (name: string) => {
      if (!Omegga.getPlayer(name).isHost()) return;
      await this.store.wipe();
      Omegga.broadcast('"Cleared record for first joins"');
    };

    const cmdShowRules = (name: string) => {
      if (!this.cooldown(name)) return;
      const player = Omegga.getPlayer(name);
      if (player) this.showRules(player);
    };

    Omegga.on('chatcmd:rules:reset', cmdResetRules)
      .on('cmd:rules:reset', cmdResetRules)
      .on('chatcmd:rules', cmdShowRules)
      .on('cmd:rules', cmdShowRules);

    // determine of rules should be display on join
    if (this.config['on-join'])
      Omegga.on('join', async player => {
        try {
          if (
            !this.config['only-first-join'] ||
            (await this.isFirstJoin(player.id))
          ) {
            this.showRules(player);
          }
        } catch (err) {
          console.error('Error displaying rules', err);
        }
      });

    return { registeredCommands: ['rules', 'rules:reset'] };
  }

  async stop() {}
}
