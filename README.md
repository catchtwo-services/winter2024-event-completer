## PokéTwo Winter 2024 Event Completer

Hiya! This is a standalone event completer that does the following:
- evolves the required amount of pokemon
- releases the required amount of (non-rare, filtered) pokemon
- sells/buys each other's market listings to keep your money yours & complete quests

  
> [!NOTE]
> ALL YOUR ACCOUNTS MUST BE IN A SHARED SERVER

> [!IMPORTANT]
> Credit to @meneerplee (@iLoveP0kemon), I (@kyan0045) started rewriting part of his (ugly) code but I ran out of time.

### Setup

As usual, you need NodeJS installed, you can install packages through ``npm i`` or on online pterodactyl hosts by uploading the package.json to the container directory.

You must first enter your shared guildId (server ID) in [./config.json](config.json), then you must enter your tokens in [./tokens.txt](tokens.txt). 
You can start it with ``node index.js``, you can also try ``node newIndex.js``, but this has not been tested properly
