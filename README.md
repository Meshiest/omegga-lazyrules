# lazy rules plugin

An rules plugin for [omegga](https://github.com/brickadia-community/omegga). A5 Only.

![A screenshot of the rules](https://i.imgur.com/pSWtUqs.png)

## Install

* `git clone https://github.com/meshiest/omegga-lazyrules lazyrules` in `plugins` directory
* Modify the RULES.txt file with your rules. All `$1` will be replaced with the player name

## Commands

 * `!rules` - See the rules
 * `!rules:reset` - Clear all "first join" history

## Configs

* `on-join` - Show rules whenever someone joins (like extended motd)
* `only-first-join` - Show connection rules only when someone joins for the first time

## Example Formatting

Below is the provided `RULES.txt` that you should modify (As seen in the screenshot)

    <b><size="20">Welcome to the server, $1!</></>
    The rules are as follows:
      1. No <i>Harassment</>
      2. No <code>Spam</>
      3. Don't build on other people's stuff
    <color="ffff00">Take care!</>
    Check out this <link="https://google.com">link</>!
