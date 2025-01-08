const fs = require("fs");

const tokens = fs
  .readFileSync("tokens.txt", "utf8")
  .replace(/\r/g, "")
  .split("\n");
const config = require("./config.js");
const { checkRarity } = require("pokehint");

let tasks = {};
let market = {};
let admin = [];
let done = 0;
let counter = 0;

setTimeout(async () => {
  fs.readFile("tasks.json", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      return;
    }
    tasks = JSON.parse(data);
  });

  fs.readFile("market.json", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      return;
    }
    market = JSON.parse(data);
  });
}, 1);

setInterval(() => {
  fs.writeFileSync("tasks.json", JSON.stringify(tasks, null, 2));
  fs.writeFileSync("market.json", JSON.stringify(market, null, 2));
}, 5000);

async function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

tokens.forEach(async (token) => {
  const { Client } = require("discord.js-selfbot-v13");
  const client = new Client({ checkUpdate: false, readyStatus: false });
  let pokemon = [];

  client.login(token).catch((err) => {
    sendLog(null, `Failed to login with token: ${token}`, "error");
  });

  client.on("ready", async () => {
    counter++;
    if (!tasks[client.user.username]) tasks[client.user.username] = {};
    if (!market[client.user.username]) market[client.user.username] = [];
    tasks[client.user.username].spend = 1;
    guild = client.guilds.cache.get(config.guildId);
    let channel = guild.channels.cache.find((channel) =>
      channel.name.includes(client.user.username)
    );
    const member = guild.members.cache.get(client.user.id);
    if (member && member.permissions.has("ADMINISTRATOR")) {
      admin.push(client.user.id);
    }

    await wait(3000);

    if (!channel && admin[0]) {
      sendLog(
        client.user.username,
        `Channel not found, creating one...`,
        "error"
      );
      await guild.channels
        .create(client.user.username, { type: "text" })
        .then(() => {
          sendLog(client.user.username, `Channel created!`, "success");
        });
      channel = guild.channels.cache.find((channel) =>
        channel.name.includes(client.user.username)
      );
    } else if (!channel && !admin[0]) {
      sendLog(
        client.user.username,
        `Channel not found & no account with administrator found`,
        "error"
      );
      process.exit(0);
    } else if (channel) {
      //sendLog(client.user.username, `Channel found!`, "success");
    }

    channel
      .createMessageCollector({
        filter: (msg) =>
          msg.author.id === "716390085896962058" &&
          msg?.embeds[0]?.title === "Christmas 2024 — Tasks & Inventory",
        time: 20000,
        max: 1,
      })
      .on("collect", (msg) => {
        const description = msg.embeds[0].description;
        const splitIndex = description.indexOf(
          "Help Santa Snorlax make toys and gifts by completing various tasks, and earn Pokécoins, shards, redeems, special event Pokémon and more along the way!"
        );
        if (splitIndex !== -1) {
          const tasksString = description
            .substring(
              splitIndex +
                "Help Santa Snorlax make toys and gifts by completing various tasks, and earn Pokécoins, shards, redeems, special event Pokémon and more along the way!"
                  .length
            )
            .trim();

          const tasksArray = tasksString.split(/\n(?=\*\*[A-E]\d\.\*\*)/);
          const cleanedArray = tasksArray
            .map((task) => {
              return task
                .replace(/\*\*/g, "")
                .replace(/[A-E]\d\./, "")
                .trim();
            })
            .filter((task) => !task.includes("Catch"));

          cleanedArray.forEach((task) => {
            if (task.includes("Spend")) {
              const amount = task.match(/\d+/)[0];
              tasks[client.user.username].spend = parseInt(amount);
            } else if (task.includes("Release")) {
              const amount = task.match(/\d+/)[0];
              tasks[client.user.username].release = parseInt(amount);
            } else if (task.includes("Evolve")) {
              const amount = task.match(/\d+/)[0];
              tasks[client.user.username].evolve = parseInt(amount);
            } else if (task.includes("Earn")) {
              const amount = task.match(/\d+/)[0];
              tasks[client.user.username].earn = parseInt(amount);
            } else if (task.includes("Trade")) {
              const amount = task.match(/\d+/)[0];
              tasks[client.user.username].trade = parseInt(amount);
            }
          });
        }
      });
    channel.send("<@716390085896962058> christmas tasks");
    channel.send("<@716390085896962058> order number-");

    channel
      .createMessageCollector({
        filter: (msg) =>
          msg.author.id === "716390085896962058" &&
          msg?.embeds[0]?.title === "Your pokémon",
        time: 20000,
        max: 1,
      })
      .on("collect", async (msg) => {
        const description = msg.embeds[0].description;
        description.split("\n").forEach(async (line) => {
          const idMatch = line.match(/^`(\d+)`/);
          const nameMatch = line.match(/>\s(.+?)<:/);
          const ivMatch = line.match(/•\s(\d+\.\d+)%/);
          const shinyMatch = line.includes("✨");

          if (idMatch && nameMatch && ivMatch) {
            const id = idMatch[1];
            const name = nameMatch[1].replace("✨", "").trimStart();
            const iv = ivMatch[1];
            const shiny = shinyMatch ? true : false;
            let rarity;
            try {
              rarity = await checkRarity(name);
            } catch (err) {
              rarity = "Unknown";
            }
            const rare = rarity !== "Regular";

            pokemon.push({ id, name, iv, shiny, rare });
          }
        });

        // Listen for message updates
        messageUpdateListener = async (oldMessage, newMessage) => {
          if (newMessage.id !== msg.id) return;

          const updatedDescription = newMessage.embeds[0].description;
          updatedDescription.split("\n").forEach(async (line) => {
            const idMatch = line.match(/^`(\d+)`/);
            const nameMatch = line.match(/>\s(.+?)<:/);
            const ivMatch = line.match(/•\s(\d+\.\d+)%/);
            const shinyMatch = line.includes("✨");

            if (idMatch && nameMatch && ivMatch) {
              const id = idMatch[1];
              const name = nameMatch[1].replace("✨", "").trimStart();
              const iv = ivMatch[1];
              const shiny = shinyMatch ? true : false;
              let rarity;
              try {
                rarity = await checkRarity(name);
              } catch (err) {
                rarity = "Unknown";
              }
              const rare = rarity !== "Regular";

              pokemon.push({ id, name, iv, shiny, rare });
            }
          });

          await handleReleaseTask(client, channel, pokemon, tasks);
          await handleSellTask(client, channel, pokemon, tasks, market);
          await handleBuyTask(client, channel, tasks, market);
          if (tasks[client.user.username].evolve > 0) {
            /*channel.send(
              "<@716390085896962058> p --n Kadabra Machoke Graveler Haunter Boldore Gurdurr Karrablast Shelmet Phantump Pumpkaboo"
            );
    
            channel
              .createMessageCollector({
                filter: (msg) =>
                  (msg.author.id === "716390085896962058" &&
                    msg?.embeds[0]?.title === "Your pokémon") ||
                  msg.content === "No pokémon found.",
                time: 20000,
                max: 1,
              })
              .on("collect", async (msg) => {
                if (msg.embeds[0]) {
                  const description = msg.embeds[0].description;
                  description?.split("\n").forEach(async (line) => {
                    const idMatch = line.match(/^`(\d+)`/);
                    const nameMatch = line.match(/>\s(.+?)<:/);
                    const ivMatch = line.match(/•\s(\d+\.\d+)%/);
                    const shinyMatch = line.includes("✨");
    
                    if (idMatch && nameMatch && ivMatch) {
                      const id = idMatch[1];
                      const name = nameMatch[1].replace("✨", "").trimStart();
                      const iv = ivMatch[1];
                      const shiny = shinyMatch ? true : false;
                      const rarity = await checkRarity(name);
                      const rare = rarity !== "Regular";
    
                      pokemon.push({ id, name, iv, shiny, rare });
                    }
                  });
    
                  // Listen for message updates
                  messageUpdateListener =async (oldMessage, newMessage) => {
                    if (newMessage?.id !== msg.id) return;
    
                    const updatedDescription = newMessage?.embeds[0]?.description;
                    updatedDescription?.split("\n").forEach(async (line) => {
                      const idMatch = line.match(/^`(\d+)`/);
                      const nameMatch = line.match(/>\s(.+?)<:/);
                      const ivMatch = line.match(/•\s(\d+\.\d+)%/);
                      const shinyMatch = line.includes("✨");
    
                      if (idMatch && nameMatch && ivMatch) {
                        const id = idMatch[1];
                        const name = nameMatch[1].replace("✨", "").trimStart();
                        const iv = ivMatch[1];
                        const shiny = shinyMatch ? true : false;
                        const rarity = await checkRarity(name);
                        const rare = rarity !== "Regular";
    
                        pokemon.push({ id, name, iv, shiny, rare });
                      }
                    });
                  };
                  client.off("messageUpdate", messageUpdateListener);
                }
                if (msg?.components[0]?.components[1]?.disabled === false) {
                  msg.clickButton(msg?.components[0]?.components[1]?.customId);
                } else if (
                  msg?.components[0]?.components[1]?.disabled === true ||
                  msg.content === "No pokémon found."
                ) {*/
            setTimeout(() => {
              channel.send(
                "<@716390085896962058> p --n Mantyke --n Charjabug --n Stantler --n Hisuian Qwilfish --n Caterpie --n Weedle --n Wurmple --n Scatterbug --n Metapod --n Kakuna --n Silcoon --n Cascoon --n Kricketot --n Blipbug --lev >9"
              );
            }, 5000);

            channel
              .createMessageCollector({
                filter: async (msg) =>
                  (msg.author.id === "716390085896962058" &&
                    channel.messages.fetch(msg?.reference?.messageId)
                      .content ===
                      "<@716390085896962058> p --n Mantyke --n Charjabug --n Stantler --n Hisuian Qwilfish --n Caterpie --n Weedle --n Wurmple --n Scatterbug --n Metapod --n Kakuna --n Silcoon --n Cascoon --n Kricketot --n Blipbug --lev >9" &&
                    msg?.embeds[0]?.title === "Your pokémon") ||
                  msg.content === "No pokémon found!",
                time: 20000,
                max: 1,
              })
              .on("collect", async (msg) => {
                if (!msg.embeds[0]) {
                  return;
                }
                const description = msg.embeds[0].description;
                description.split("\n").forEach(async (line) => {
                  const idMatch = line.match(/^`(\d+)`/);
                  const nameMatch = line.match(/>\s(.+?)<:/);
                  const ivMatch = line.match(/•\s(\d+\.\d+)%/);
                  const shinyMatch = line.includes("✨");

                  if (idMatch && nameMatch && ivMatch) {
                    const id = idMatch[1];
                    const name = nameMatch[1].replace("✨", "").trimStart();
                    const iv = ivMatch[1];
                    const shiny = shinyMatch ? true : false;
                    let rarity;
                    try {
                      rarity = await checkRarity(name);
                    } catch (err) {
                      rarity = "Unknown";
                    }
                    const rare = rarity !== "Regular";

                    pokemon.push({ id, name, iv, shiny, rare });
                  }
                });

                // Listen for message updates
                messageUpdateListener = async (oldMessage, newMessage) => {
                  if (newMessage.id !== msg.id) return;

                  const updatedDescription = newMessage.embeds[0].description;
                  updatedDescription.split("\n").forEach(async (line) => {
                    const idMatch = line.match(/^`(\d+)`/);
                    const nameMatch = line.match(/>\s(.+?)<:/);
                    const ivMatch = line.match(/•\s(\d+\.\d+)%/);
                    const shinyMatch = line.includes("✨");

                    if (idMatch && nameMatch && ivMatch) {
                      const id = idMatch[1];
                      const name = nameMatch[1].replace("✨", "").trimStart();
                      const iv = ivMatch[1];
                      const shiny = shinyMatch ? true : false;
                      let rarity;
                      try {
                        rarity = await checkRarity(name);
                      } catch (err) {
                        rarity = "Unknown";
                      }
                      const rare = rarity !== "Regular";

                      pokemon.push({ id, name, iv, shiny, rare });
                    }
                  });
                  if (
                    msg.components[0]?.components[1]?.disabled === false &&
                    msg.embeds[0] &&
                    msg.embeds[0].footer &&
                    msg.embeds[0].footer.text &&
                    (() => {
                      const footerText = msg.embeds[0].footer.text;
                      const match = footerText.match(
                        /(\d+)[^\d]+(\d+)[^\d]+(\d+)/
                      );
                      if (match) {
                        const lastNumber = parseInt(match[3], 10);
                        const secondLastNumber = parseInt(match[2], 10);
                        if (lastNumber === secondLastNumber) return false;
                      }
                      return true;
                    })()
                  ) {
                    msg.clickButton(
                      msg?.components[0]?.components[1]?.customId
                    );
                  } else if (
                    msg.components[0]?.components[1].disabled === true ||
                    (msg.embeds[0] && !msg.components[0]) ||
                    msg.embeds[0].footer.text === "" ||
                    (msg.embeds[0] &&
                      msg.embeds[0].footer &&
                      msg.embeds[0].footer.text &&
                      (() => {
                        const footerText = msg.embeds[0].footer.text;
                        const match = footerText.match(
                          /(\d+)[^\d]+(\d+)[^\d]+(\d+)/
                        );
                        if (match) {
                          const lastNumber = parseInt(match[3], 10);
                          const secondLastNumber = parseInt(match[2], 10);
                          if (lastNumber === secondLastNumber) return true;
                        }
                        return false;
                      })())
                  ) {
                    client.off("messageUpdate", messageUpdateListener);

                    const filteredPokemon = pokemon
                      .filter(
                        (p) =>
                          !p.rare &&
                          !p.shiny &&
                          [
                            "Mantyke",
                            "Charjabug",
                            "Stantler",
                            "Hisuian Qwilfish",
                            "Caterpie",
                            "Weedle",
                            "Wurmple",
                            "Scatterbug",
                            "Metapod",
                            "Kakuna",
                            "Silcoon",
                            "Cascoon",
                            "Kricketot",
                            "Blipbug",
                          ].includes(p.name) &&
                          parseFloat(p.iv) >= 10.0 &&
                          parseFloat(p.iv) <= 85.0
                      )
                      .slice(0, tasks[client.user.username].evolve)
                      .map((p) => p.id);

                    if (
                      filteredPokemon.length ==
                      tasks[client.user.username].evolve
                    ) {
                      channel.send(
                        `<@716390085896962058> evolve ${filteredPokemon.join(
                          " "
                        )}`
                      );

                      sendLog(
                        client.user.username,
                        `Evolved ${filteredPokemon.length} pokemon!`,
                        "success"
                      );
                      tasks[client.user.username].evolve = 0;
                    } else if (
                      filteredPokemon.length <
                      tasks[client.user.username].evolve
                    ) {
                      sendLog(
                        client.user.username,
                        `Not enough pokemon to evolve, attempting to buy new ones!`,
                        "error"
                      );
                      channel.send(
                        `<@716390085896962058> m s --n Mantyke --n Charjabug --n Stantler --n Hisuian Qwilfish --n Caterpie --n Weedle --n Wurmple --n Scatterbug --n Metapod --n Kakuna --n Silcoon --n Cascoon --n Kricketot --n Blipbug --lev >9 --o price`
                      );

                      channel
                        .createMessageCollector({
                          filter: (msg) =>
                            msg.author.id === "716390085896962058" &&
                            msg?.embeds[0]?.title === "Pokétwo Marketplace",
                          time: 20000,
                          max: 1,
                        })
                        .on("collect", async (msg) => {
                          const description = msg.embeds[0].description;
                          const marketBuys = description
                            .split("\n")
                            .map((line) => {
                              const match = line.match(
                                /^(\d+)\s+.*•\s+(\d+)\s+pc$/
                              );
                              if (match) {
                                const id = match[1];
                                const price = match[2];
                                if (price < 250) {
                                  return { id };
                                } else {
                                  return null;
                                }
                              }
                              return null;
                            })
                            .filter((buyable) => buyable !== null);

                          marketBuys.forEach((buyable) => {
                            channel.send(
                              `<@716390085896962058> m buy ${buyable.id}`
                            );
                            channel
                              .createMessageCollector({
                                filter: (msg) =>
                                  msg.author.id === "716390085896962058" &&
                                  msg?.content.includes(
                                    "Are you sure you want to buy the following pokémon"
                                  ) &&
                                  channel.messages.fetch(
                                    msg.reference.messageId
                                  ).author.id === client.user.id,
                                time: 20000,
                                max: 1,
                              })
                              .on("collect", async (msg) => {
                                msg.clickButton(
                                  msg.components[0].components[0].customId
                                );
                                sendLog(
                                  client.user.username,
                                  `Bought pokemon with ID ${buyable.id}!`,
                                  "success"
                                );
                              });
                          });
                        });
                    }
                  }
                };

                if (msg.embeds[0] && !msg.components[0]) {
                  client.off("messageUpdate", messageUpdateListener);

                  const filteredPokemon = pokemon
                    .filter(
                      (p) =>
                        !p.rare &&
                        !p.shiny &&
                        [
                          "Mantyke",
                          "Charjabug",
                          "Stantler",
                          "Hisuian Qwilfish",
                          "Caterpie",
                          "Weedle",
                          "Wurmple",
                          "Scatterbug",
                          "Metapod",
                          "Kakuna",
                          "Silcoon",
                          "Cascoon",
                          "Kricketot",
                          "Blipbug",
                        ].includes(p.name) &&
                        parseFloat(p.iv) >= 10.0 &&
                        parseFloat(p.iv) <= 85.0
                    )
                    .slice(0, tasks[client.user.username].evolve)
                    .map((p) => p.id);

                  if (
                    filteredPokemon.length == tasks[client.user.username].evolve
                  ) {
                    channel.send(
                      `<@716390085896962058> evolve ${filteredPokemon.join(
                        " "
                      )}`
                    );

                    sendLog(
                      client.user.username,
                      `Evolved ${filteredPokemon.length} pokemon!`,
                      "success"
                    );
                    tasks[client.user.username].evolve = 0;
                  } else if (
                    filteredPokemon.length < tasks[client.user.username].evolve
                  ) {
                    sendLog(
                      client.user.username,
                      `Not enough pokemon to evolve, attempting to buy new ones!`,
                      "error"
                    );
                    channel.send(
                      `<@716390085896962058> m s --n Mantyke --n Charjabug --n Stantler --n Hisuian Qwilfish --n Caterpie --n Weedle --n Wurmple --n Scatterbug --n Metapod --n Kakuna --n Silcoon --n Cascoon --n Kricketot --n Blipbug --lev >9 --o price`
                    );

                    channel
                      .createMessageCollector({
                        filter: (msg) =>
                          msg.author.id === "716390085896962058" &&
                          msg?.embeds[0]?.title === "Pokétwo Marketplace",
                        time: 20000,
                        max: 1,
                      })
                      .on("collect", async (msg) => {
                        const description = msg.embeds[0].description;
                        const marketBuys = description
                          .split("\n")
                          .map((line) => {
                            const match = line.match(
                              /^`(\d+)`\s+.*•\s+(\d+)\s+pc$/
                            );
                            if (match) {
                              const id = match[1];
                              const price = match[2];
                              if (price < 250) {
                                return { id };
                              } else {
                                return null;
                              }
                            }
                            return null;
                          })
                          .filter((buyable) => buyable !== null);

                        (async () => {
                          for (
                            let i = 0;
                            i < marketBuys.length &&
                            i + filteredPokemon.length <
                              tasks[client.user.username].evolve;
                            i++
                          ) {
                            const buyable = marketBuys[i];
                            await channel.send(
                              `<@716390085896962058> m buy ${buyable.id}`
                            );

                            const collector = channel.createMessageCollector({
                              filter: (msg) =>
                                msg.author.id === "716390085896962058" &&
                                msg?.content.includes(
                                  "Are you sure you want to buy this"
                                ) &&
                                channel.messages.fetch(msg.reference.messageId)
                                  .author.id === client.user.id,
                              time: 20000,
                              max: 1,
                            });

                            await new Promise((resolve) => {
                              collector.on("collect", async (msg) => {
                                await msg.clickButton(
                                  msg.components[0].components[0].customId
                                );
                                sendLog(
                                  client.user.username,
                                  `Bought pokemon with ID ${buyable.id}!`,
                                  "success"
                                );
                                resolve();
                              });
                            });
                          }

                          setTimeout(() => {
                            channel.send(
                              "<@716390085896962058> p --n Mantyke --n Charjabug --n Stantler --n Hisuian Qwilfish --n Caterpie --n Weedle --n Wurmple --n Scatterbug --n Metapod --n Kakuna --n Silcoon --n Cascoon --n Kricketot --n Blipbug --lev >9"
                            );
                          }, 5000);

                          channel
                            .createMessageCollector({
                              filter: async (msg) =>
                                (msg.author.id === "716390085896962058" &&
                                  channel.messages.fetch(
                                    msg.reference.messageId
                                  ).content ===
                                    "<@716390085896962058> p --n Mantyke --n Charjabug --n Stantler --n Hisuian Qwilfish --n Caterpie --n Weedle --n Wurmple --n Scatterbug --n Metapod --n Kakuna --n Silcoon --n Cascoon --n Kricketot --n Blipbug --lev >9" &&
                                  msg?.embeds[0]?.title === "Your pokémon") ||
                                msg.content === "No pokémon found!",
                              time: 20000,
                              max: 1,
                            })
                            .on("collect", async (msg) => {
                              if (!msg.embeds[0]) {
                                return;
                              }
                              const description = msg.embeds[0].description;
                              description.split("\n").forEach(async (line) => {
                                const idMatch = line.match(/^`(\d+)`/);
                                const nameMatch = line.match(/>\s(.+?)<:/);
                                const ivMatch = line.match(/•\s(\d+\.\d+)%/);
                                const shinyMatch = line.includes("✨");

                                if (idMatch && nameMatch && ivMatch) {
                                  const id = idMatch[1];
                                  const name = nameMatch[1]
                                    .replace("✨", "")
                                    .trimStart();
                                  const iv = ivMatch[1];
                                  const shiny = shinyMatch ? true : false;
                                  let rarity;
                                  try {
                                    rarity = await checkRarity(name);
                                  } catch (err) {
                                    rarity = "Unknown";
                                  }
                                  const rare = rarity !== "Regular";

                                  pokemon.push({ id, name, iv, shiny, rare });
                                }
                              });

                              if (msg.embeds[0] && !msg.components[0]) {
                                const filteredPokemon = pokemon
                                  .filter(
                                    (p) =>
                                      !p.rare &&
                                      !p.shiny &&
                                      [
                                        "Mantyke",
                                        "Charjabug",
                                        "Stantler",
                                        "Hisuian Qwilfish",
                                        "Caterpie",
                                        "Weedle",
                                        "Wurmple",
                                        "Scatterbug",
                                        "Metapod",
                                        "Kakuna",
                                        "Silcoon",
                                        "Cascoon",
                                        "Kricketot",
                                        "Blipbug",
                                      ].includes(p.name) &&
                                      parseFloat(p.iv) >= 10.0 &&
                                      parseFloat(p.iv) <= 85.0
                                  )
                                  .slice(0, tasks[client.user.username].evolve)
                                  .map((p) => p.id);

                                if (
                                  filteredPokemon.length ==
                                  tasks[client.user.username].evolve
                                ) {
                                  channel.send(
                                    `<@716390085896962058> evolve ${filteredPokemon.join(
                                      " "
                                    )}`
                                  );

                                  sendLog(
                                    client.user.username,
                                    `Evolved ${filteredPokemon.length} pokemon!`,
                                    "success"
                                  );
                                  tasks[client.user.username].evolve = 0;
                                }
                              }
                            });
                        })();
                      });
                  }
                }

                if (
                  msg.components[0]?.components[1] &&
                  msg.embeds[0] &&
                  msg.embeds[0].footer &&
                  msg.embeds[0].footer.text &&
                  (() => {
                    const footerText = msg.embeds[0].footer.text;
                    const match = footerText.match(
                      /(\d+)[^\d]+(\d+)[^\d]+(\d+)/
                    );
                    if (match) {
                      const lastNumber = parseInt(match[3], 10);
                      const secondLastNumber = parseInt(match[2], 10);
                      if (lastNumber === secondLastNumber) return false;
                    }
                    return true;
                  })()
                ) {
                  client.on("messageUpdate", messageUpdateListener);
                  msg.clickButton(msg?.components[0]?.components[1]?.customId);
                }
              });
            //}

            /*if (msg?.components[0]?.components[1]) {
              client.on("messageUpdate", messageUpdateListener);
              msg.clickButton(msg?.components[0]?.components[1]?.customId);
            }*/
            //});
          }
          await tasksCompleted(client, channel, tasks, pokemon);
        };

        if (msg.components[0]?.components[1]) {
          client.on("messageUpdate", messageUpdateListener);
          msg
            .clickButton(msg?.components[0]?.components[1]?.customId)
            .catch((err) => {
              console.log(err);
              msg.clickButton(msg?.components[0]?.components[1]?.customId);
            });
        } else {
          await handleReleaseTask(client, channel, pokemon, tasks);
          await handleSellTask(client, channel, pokemon, tasks, market);
          await handleBuyTask(client, channel, tasks, market);
          if (tasks[client.user.username].evolve > 0) {
            /*channel.send(
              "<@716390085896962058> p --n Kadabra Machoke Graveler Haunter Boldore Gurdurr Karrablast Shelmet Phantump Pumpkaboo"
            );
    
            channel
              .createMessageCollector({
                filter: (msg) =>
                  (msg.author.id === "716390085896962058" &&
                    msg?.embeds[0]?.title === "Your pokémon") ||
                  msg.content === "No pokémon found.",
                time: 20000,
                max: 1,
              })
              .on("collect", async (msg) => {
                if (msg.embeds[0]) {
                  const description = msg.embeds[0].description;
                  description?.split("\n").forEach(async (line) => {
                    const idMatch = line.match(/^`(\d+)`/);
                    const nameMatch = line.match(/>\s(.+?)<:/);
                    const ivMatch = line.match(/•\s(\d+\.\d+)%/);
                    const shinyMatch = line.includes("✨");
    
                    if (idMatch && nameMatch && ivMatch) {
                      const id = idMatch[1];
                      const name = nameMatch[1].replace("✨", "").trimStart();
                      const iv = ivMatch[1];
                      const shiny = shinyMatch ? true : false;
                      const rarity = await checkRarity(name);
                      const rare = rarity !== "Regular";
    
                      pokemon.push({ id, name, iv, shiny, rare });
                    }
                  });
    
                  // Listen for message updates
                  messageUpdateListener =async (oldMessage, newMessage) => {
                    if (newMessage?.id !== msg.id) return;
    
                    const updatedDescription = newMessage?.embeds[0]?.description;
                    updatedDescription?.split("\n").forEach(async (line) => {
                      const idMatch = line.match(/^`(\d+)`/);
                      const nameMatch = line.match(/>\s(.+?)<:/);
                      const ivMatch = line.match(/•\s(\d+\.\d+)%/);
                      const shinyMatch = line.includes("✨");
    
                      if (idMatch && nameMatch && ivMatch) {
                        const id = idMatch[1];
                        const name = nameMatch[1].replace("✨", "").trimStart();
                        const iv = ivMatch[1];
                        const shiny = shinyMatch ? true : false;
                        const rarity = await checkRarity(name);
                        const rare = rarity !== "Regular";
    
                        pokemon.push({ id, name, iv, shiny, rare });
                      }
                    });
                  };
                  client.off("messageUpdate", messageUpdateListener);
                }
                if (msg?.components[0]?.components[1]?.disabled === false) {
                  msg.clickButton(msg?.components[0]?.components[1]?.customId);
                } else if (
                  msg?.components[0]?.components[1]?.disabled === true ||
                  msg.content === "No pokémon found."
                ) {*/
            setTimeout(() => {
              channel.send(
                "<@716390085896962058> p --n Mantyke --n Charjabug --n Stantler --n Hisuian Qwilfish --n Caterpie --n Weedle --n Wurmple --n Scatterbug --n Metapod --n Kakuna --n Silcoon --n Cascoon --n Kricketot --n Blipbug --lev >9"
              );
            }, 5000);

            channel
              .createMessageCollector({
                filter: async (msg) =>
                  (msg.author.id === "716390085896962058" &&
                    channel.messages.fetch(msg?.reference?.messageId)
                      .content ===
                      "<@716390085896962058> p --n Mantyke --n Charjabug --n Stantler --n Hisuian Qwilfish --n Caterpie --n Weedle --n Wurmple --n Scatterbug --n Metapod --n Kakuna --n Silcoon --n Cascoon --n Kricketot --n Blipbug --lev >9" &&
                    msg?.embeds[0]?.title === "Your pokémon") ||
                  msg.content === "No pokémon found!",
                time: 20000,
                max: 1,
              })
              .on("collect", async (msg) => {
                if (!msg.embeds[0]) {
                  return;
                }
                const description = msg.embeds[0].description;
                description.split("\n").forEach(async (line) => {
                  const idMatch = line.match(/^`(\d+)`/);
                  const nameMatch = line.match(/>\s(.+?)<:/);
                  const ivMatch = line.match(/•\s(\d+\.\d+)%/);
                  const shinyMatch = line.includes("✨");

                  if (idMatch && nameMatch && ivMatch) {
                    const id = idMatch[1];
                    const name = nameMatch[1].replace("✨", "").trimStart();
                    const iv = ivMatch[1];
                    const shiny = shinyMatch ? true : false;
                    let rarity;
                    try {
                      rarity = await checkRarity(name);
                    } catch (err) {
                      rarity = "Unknown";
                    }
                    const rare = rarity !== "Regular";

                    pokemon.push({ id, name, iv, shiny, rare });
                  }
                });

                // Listen for message updates
                messageUpdateListener = async (oldMessage, newMessage) => {
                  if (newMessage.id !== msg.id) return;

                  const updatedDescription = newMessage.embeds[0].description;
                  updatedDescription.split("\n").forEach(async (line) => {
                    const idMatch = line.match(/^`(\d+)`/);
                    const nameMatch = line.match(/>\s(.+?)<:/);
                    const ivMatch = line.match(/•\s(\d+\.\d+)%/);
                    const shinyMatch = line.includes("✨");

                    if (idMatch && nameMatch && ivMatch) {
                      const id = idMatch[1];
                      const name = nameMatch[1].replace("✨", "").trimStart();
                      const iv = ivMatch[1];
                      const shiny = shinyMatch ? true : false;
                      let rarity;
                      try {
                        rarity = await checkRarity(name);
                      } catch (err) {
                        rarity = "Unknown";
                      }
                      const rare = rarity !== "Regular";

                      pokemon.push({ id, name, iv, shiny, rare });
                    }
                  });
                  if (
                    msg.components[0]?.components[1]?.disabled === false &&
                    msg.embeds[0] &&
                    msg.embeds[0].footer &&
                    msg.embeds[0].footer.text &&
                    (() => {
                      const footerText = msg.embeds[0].footer.text;
                      const match = footerText.match(
                        /(\d+)[^\d]+(\d+)[^\d]+(\d+)/
                      );
                      if (match) {
                        const lastNumber = parseInt(match[3], 10);
                        const secondLastNumber = parseInt(match[2], 10);
                        if (lastNumber === secondLastNumber) return false;
                      }
                      return true;
                    })()
                  ) {
                    msg.clickButton(
                      msg?.components[0]?.components[1]?.customId
                    );
                  } else if (
                    msg.components[0]?.components[1].disabled === true ||
                    (msg.embeds[0] && !msg.components[0]) ||
                    msg.embeds[0].footer.text === "" ||
                    (msg.embeds[0] &&
                      msg.embeds[0].footer &&
                      msg.embeds[0].footer.text &&
                      (() => {
                        const footerText = msg.embeds[0].footer.text;
                        const match = footerText.match(
                          /(\d+)[^\d]+(\d+)[^\d]+(\d+)/
                        );
                        if (match) {
                          const lastNumber = parseInt(match[3], 10);
                          const secondLastNumber = parseInt(match[2], 10);
                          if (lastNumber === secondLastNumber) return true;
                        }
                        return false;
                      })())
                  ) {
                    client.off("messageUpdate", messageUpdateListener);

                    const filteredPokemon = pokemon
                      .filter(
                        (p) =>
                          !p.rare &&
                          !p.shiny &&
                          [
                            "Mantyke",
                            "Charjabug",
                            "Stantler",
                            "Hisuian Qwilfish",
                            "Caterpie",
                            "Weedle",
                            "Wurmple",
                            "Scatterbug",
                            "Metapod",
                            "Kakuna",
                            "Silcoon",
                            "Cascoon",
                            "Kricketot",
                            "Blipbug",
                          ].includes(p.name) &&
                          parseFloat(p.iv) >= 10.0 &&
                          parseFloat(p.iv) <= 85.0
                      )
                      .slice(0, tasks[client.user.username].evolve)
                      .map((p) => p.id);

                    if (
                      filteredPokemon.length ==
                      tasks[client.user.username].evolve
                    ) {
                      channel.send(
                        `<@716390085896962058> evolve ${filteredPokemon.join(
                          " "
                        )}`
                      );

                      sendLog(
                        client.user.username,
                        `Evolved ${filteredPokemon.length} pokemon!`,
                        "success"
                      );
                      tasks[client.user.username].evolve = 0;
                    } else if (
                      filteredPokemon.length <
                      tasks[client.user.username].evolve
                    ) {
                      sendLog(
                        client.user.username,
                        `Not enough pokemon to evolve, attempting to buy new ones!`,
                        "error"
                      );
                      channel.send(
                        `<@716390085896962058> m s --n Mantyke --n Charjabug --n Stantler --n Hisuian Qwilfish --n Caterpie --n Weedle --n Wurmple --n Scatterbug --n Metapod --n Kakuna --n Silcoon --n Cascoon --n Kricketot --n Blipbug --lev >9 --o price`
                      );

                      channel
                        .createMessageCollector({
                          filter: (msg) =>
                            msg.author.id === "716390085896962058" &&
                            msg?.embeds[0]?.title === "Pokétwo Marketplace",
                          time: 20000,
                          max: 1,
                        })
                        .on("collect", async (msg) => {
                          const description = msg.embeds[0].description;
                          const marketBuys = description
                            .split("\n")
                            .map((line) => {
                              const match = line.match(
                                /^(\d+)\s+.*•\s+(\d+)\s+pc$/
                              );
                              if (match) {
                                const id = match[1];
                                const price = match[2];
                                if (price < 250) {
                                  return { id };
                                } else {
                                  return null;
                                }
                              }
                              return null;
                            })
                            .filter((buyable) => buyable !== null);

                          marketBuys.forEach((buyable) => {
                            channel.send(
                              `<@716390085896962058> m buy ${buyable.id}`
                            );
                            channel
                              .createMessageCollector({
                                filter: (msg) =>
                                  msg.author.id === "716390085896962058" &&
                                  msg?.content.includes(
                                    "Are you sure you want to buy the following pokémon"
                                  ) &&
                                  channel.messages.fetch(
                                    msg.reference.messageId
                                  ).author.id === client.user.id,
                                time: 20000,
                                max: 1,
                              })
                              .on("collect", async (msg) => {
                                msg.clickButton(
                                  msg.components[0].components[0].customId
                                );
                                sendLog(
                                  client.user.username,
                                  `Bought pokemon with ID ${buyable.id}!`,
                                  "success"
                                );
                              });
                          });
                        });
                    }
                  }
                };

                if (msg.embeds[0] && !msg.components[0]) {
                  client.off("messageUpdate", messageUpdateListener);

                  const filteredPokemon = pokemon
                    .filter(
                      (p) =>
                        !p.rare &&
                        !p.shiny &&
                        [
                          "Mantyke",
                          "Charjabug",
                          "Stantler",
                          "Hisuian Qwilfish",
                          "Caterpie",
                          "Weedle",
                          "Wurmple",
                          "Scatterbug",
                          "Metapod",
                          "Kakuna",
                          "Silcoon",
                          "Cascoon",
                          "Kricketot",
                          "Blipbug",
                        ].includes(p.name) &&
                        parseFloat(p.iv) >= 10.0 &&
                        parseFloat(p.iv) <= 85.0
                    )
                    .slice(0, tasks[client.user.username].evolve)
                    .map((p) => p.id);

                  if (
                    filteredPokemon.length == tasks[client.user.username].evolve
                  ) {
                    channel.send(
                      `<@716390085896962058> evolve ${filteredPokemon.join(
                        " "
                      )}`
                    );

                    sendLog(
                      client.user.username,
                      `Evolved ${filteredPokemon.length} pokemon!`,
                      "success"
                    );
                    tasks[client.user.username].evolve = 0;
                  } else if (
                    filteredPokemon.length < tasks[client.user.username].evolve
                  ) {
                    sendLog(
                      client.user.username,
                      `Not enough pokemon to evolve, attempting to buy new ones!`,
                      "error"
                    );
                    channel.send(
                      `<@716390085896962058> m s --n Mantyke --n Charjabug --n Stantler --n Hisuian Qwilfish --n Caterpie --n Weedle --n Wurmple --n Scatterbug --n Metapod --n Kakuna --n Silcoon --n Cascoon --n Kricketot --n Blipbug --lev >9 --o price`
                    );

                    channel
                      .createMessageCollector({
                        filter: (msg) =>
                          msg.author.id === "716390085896962058" &&
                          msg?.embeds[0]?.title === "Pokétwo Marketplace",
                        time: 20000,
                        max: 1,
                      })
                      .on("collect", async (msg) => {
                        const description = msg.embeds[0].description;
                        const marketBuys = description
                          .split("\n")
                          .map((line) => {
                            const match = line.match(
                              /^`(\d+)`\s+.*•\s+(\d+)\s+pc$/
                            );
                            if (match) {
                              const id = match[1];
                              const price = match[2];
                              if (price < 250) {
                                return { id };
                              } else {
                                return null;
                              }
                            }
                            return null;
                          })
                          .filter((buyable) => buyable !== null);

                        (async () => {
                          for (
                            let i = 0;
                            i < marketBuys.length &&
                            i + filteredPokemon.length <
                              tasks[client.user.username].evolve;
                            i++
                          ) {
                            const buyable = marketBuys[i];
                            await channel.send(
                              `<@716390085896962058> m buy ${buyable.id}`
                            );

                            const collector = channel.createMessageCollector({
                              filter: (msg) =>
                                msg.author.id === "716390085896962058" &&
                                msg?.content.includes(
                                  "Are you sure you want to buy this"
                                ) &&
                                channel.messages.fetch(msg.reference.messageId)
                                  .author.id === client.user.id,
                              time: 20000,
                              max: 1,
                            });

                            await new Promise((resolve) => {
                              collector.on("collect", async (msg) => {
                                await msg.clickButton(
                                  msg.components[0].components[0].customId
                                );
                                sendLog(
                                  client.user.username,
                                  `Bought pokemon with ID ${buyable.id}!`,
                                  "success"
                                );
                                resolve();
                              });
                            });
                          }

                          setTimeout(() => {
                            channel.send(
                              "<@716390085896962058> p --n Mantyke --n Charjabug --n Stantler --n Hisuian Qwilfish --n Caterpie --n Weedle --n Wurmple --n Scatterbug --n Metapod --n Kakuna --n Silcoon --n Cascoon --n Kricketot --n Blipbug --lev >9"
                            );
                          }, 5000);

                          channel
                            .createMessageCollector({
                              filter: async (msg) =>
                                (msg.author.id === "716390085896962058" &&
                                  channel.messages.fetch(
                                    msg.reference.messageId
                                  ).content ===
                                    "<@716390085896962058> p --n Mantyke --n Charjabug --n Stantler --n Hisuian Qwilfish --n Caterpie --n Weedle --n Wurmple --n Scatterbug --n Metapod --n Kakuna --n Silcoon --n Cascoon --n Kricketot --n Blipbug --lev >9" &&
                                  msg?.embeds[0]?.title === "Your pokémon") ||
                                msg.content === "No pokémon found!",
                              time: 20000,
                              max: 1,
                            })
                            .on("collect", async (msg) => {
                              if (!msg.embeds[0]) {
                                return;
                              }
                              const description = msg.embeds[0].description;
                              description.split("\n").forEach(async (line) => {
                                const idMatch = line.match(/^`(\d+)`/);
                                const nameMatch = line.match(/>\s(.+?)<:/);
                                const ivMatch = line.match(/•\s(\d+\.\d+)%/);
                                const shinyMatch = line.includes("✨");

                                if (idMatch && nameMatch && ivMatch) {
                                  const id = idMatch[1];
                                  const name = nameMatch[1]
                                    .replace("✨", "")
                                    .trimStart();
                                  const iv = ivMatch[1];
                                  const shiny = shinyMatch ? true : false;
                                  let rarity;
                                  try {
                                    rarity = await checkRarity(name);
                                  } catch (err) {
                                    rarity = "Unknown";
                                  }
                                  const rare = rarity !== "Regular";

                                  pokemon.push({ id, name, iv, shiny, rare });
                                }
                              });

                              if (msg.embeds[0] && !msg.components[0]) {
                                const filteredPokemon = pokemon
                                  .filter(
                                    (p) =>
                                      !p.rare &&
                                      !p.shiny &&
                                      [
                                        "Mantyke",
                                        "Charjabug",
                                        "Stantler",
                                        "Hisuian Qwilfish",
                                        "Caterpie",
                                        "Weedle",
                                        "Wurmple",
                                        "Scatterbug",
                                        "Metapod",
                                        "Kakuna",
                                        "Silcoon",
                                        "Cascoon",
                                        "Kricketot",
                                        "Blipbug",
                                      ].includes(p.name) &&
                                      parseFloat(p.iv) >= 10.0 &&
                                      parseFloat(p.iv) <= 85.0
                                  )
                                  .slice(0, tasks[client.user.username].evolve)
                                  .map((p) => p.id);

                                if (
                                  filteredPokemon.length ==
                                  tasks[client.user.username].evolve
                                ) {
                                  channel.send(
                                    `<@716390085896962058> evolve ${filteredPokemon.join(
                                      " "
                                    )}`
                                  );

                                  sendLog(
                                    client.user.username,
                                    `Evolved ${filteredPokemon.length} pokemon!`,
                                    "success"
                                  );
                                  tasks[client.user.username].evolve = 0;
                                }
                              }
                            });
                        })();
                      });
                  }
                }

                if (
                  msg.components[0]?.components[1] &&
                  msg.embeds[0] &&
                  msg.embeds[0].footer &&
                  msg.embeds[0].footer.text &&
                  (() => {
                    const footerText = msg.embeds[0].footer.text;
                    const match = footerText.match(
                      /(\d+)[^\d]+(\d+)[^\d]+(\d+)/
                    );
                    if (match) {
                      const lastNumber = parseInt(match[3], 10);
                      const secondLastNumber = parseInt(match[2], 10);
                      if (lastNumber === secondLastNumber) return false;
                    }
                    return true;
                  })()
                ) {
                  client.on("messageUpdate", messageUpdateListener);
                  msg.clickButton(msg?.components[0]?.components[1]?.customId);
                }
              });
            //}

            /*if (msg?.components[0]?.components[1]) {
              client.on("messageUpdate", messageUpdateListener);
              msg.clickButton(msg?.components[0]?.components[1]?.customId);
            }*/
            //});
          }
          await tasksCompleted(client, channel, tasks, pokemon);
        }
      });

    await wait(500);
    channel.send("<@716390085896962058> p");
  });

  setInterval(() => {
    if (counter == done && counter !== 0) {
      sendLog(null, "All accounts are done completing!", "info");
      process.exit(0);
    }
  }, 1000);
});

const chalk = require("chalk");
const date = require("date-and-time");

async function handleReleaseTask(client, channel, pokemon, tasks) {
  const releaseAmount = tasks[client.user.username].release;
  if (releaseAmount <= 0) return;

  let filteredPokemon = pokemon
    .filter(
      (p) =>
        !p.rare &&
        !p.shiny &&
        parseFloat(p.iv) >= 25.0 &&
        parseFloat(p.iv) <= 75.0
    )
    .slice(0, releaseAmount)
    .map((p) => p.id);

  await channel.send(
    `<@716390085896962058> release ${filteredPokemon.join(" ")}`
  );

  const collector = channel.createMessageCollector({
    filter: (msg) =>
      msg.author.id === "716390085896962058" &&
      (msg?.content.includes(
        "Are you sure you want to release the following pokémon"
      ) ||
        msg?.content.includes("Are you sure you want to **release**")) &&
      channel.messages.fetch(msg.reference.messageId).author.id ===
        client.user.id,
    time: 20000,
    max: 1,
  });

  collector.on("collect", async (msg) => {
    await msg.clickButton(msg.components[0].components[0].customId);
    tasks[client.user.username].release = 0;
    sendLog(
      client.user.username,
      `Released ${releaseAmount} random (non-rare/non-shiny) pokemon!`,
      "success"
    );
  });

  await filteredPokemon.forEach((filtered) => {
    const index = pokemon.findIndex((p) => p.id === filtered.id);
    if (index !== -1) pokemon.splice(index, 1);
  });
}

async function handleSellTask(client, channel, pokemon, tasks, market) {
  if (
    tasks[client.user.username].earn < 1 ||
    market[client.user.username].length > 0
  )
    return;

  let filteredPokemon = await pokemon
    .filter(
      (p) =>
        !p.rare &&
        !p.shiny &&
        parseFloat(p.iv) >= 25.0 &&
        parseFloat(p.iv) <= 75.0
    )
    .slice(0, 1)
    .map((p) => p.id);

  console.log(filteredPokemon);
  await channel.send(`<@716390085896962058> m add ${filteredPokemon[0]} 1000`);

  const collector = channel.createMessageCollector({
    filter: (msg) =>
      msg.author.id === "716390085896962058" &&
      msg?.content.includes("Are you sure you want to list your") &&
      channel.messages.fetch(msg.reference.messageId).author.id ===
        client.user.id,
    time: 20000,
    max: 1,
  });

  collector.on("collect", async (msg) => {
    const listingCollector = channel.createMessageCollector({
      filter: (msg) =>
        msg.author.id === "716390085896962058" &&
        msg?.content.includes("Listed your"),
      time: 20000,
      max: 1,
    });

    listingCollector.on("collect", async (msg) => {
      const listingIdMatch = msg.content.match(/Listing #(\d+)/);
      if (listingIdMatch) {
        const listingId = listingIdMatch[1];
        tasks[client.user.username].earn = 0;
        market[client.user.username].push(listingId);
        sendLog(client.user.username, `Listed pokemon for sale!`, "success");
      }
    });

    await msg.clickButton(msg.components[0].components[0].customId);
  });
}

async function handleBuyTask(client, channel, tasks, market) {
  if (tasks[client.user.username].spend <= 0) return;

  const availableListings = Object.entries(market).flatMap(
    ([username, listings]) =>
      username !== client.user.username ? listings : []
  );

  if (availableListings.length === 0) {
    //sendLog(client.user.username, "No available listings found.", "error");
    return;
  }

  const listingId =
    availableListings[Math.floor(Math.random() * availableListings.length)];
  await channel.send(`<@716390085896962058> m buy ${listingId}`);

  const collector = channel.createMessageCollector({
    filter: (msg) =>
      msg.author.id === "716390085896962058" &&
      msg?.content.includes("Are you sure you want to buy this") &&
      channel.messages.fetch(msg.reference.messageId).author.id ===
        client.user.id,
    time: 20000,
    max: 1,
  });

  collector.on("collect", async (msg) => {
    await msg.clickButton(msg.components[0].components[0].customId);
    tasks[client.user.username].spend = 0;
    sendLog(
      client.user.username,
      `Bought pokemon with listing ID ${listingId}!`,
      "success"
    );
  });
}

function sendLog(username, message, type) {
  now = new Date();

  switch (type.toLowerCase()) {
    case "info":
      console.log(
        chalk.bold.blue(`[${type.toUpperCase()}]`) +
          ` - ` +
          chalk.white.bold(date.format(now, "HH:mm")) +
          `: ` +
          message
      );
      break;
    case "success":
      console.log(
        chalk.bold.green(`[${type.toUpperCase()}]`) +
          ` - ` +
          chalk.white.bold(date.format(now, "HH:mm")) +
          `: ` +
          chalk.bold.red(username) +
          `: ` +
          message
      );
      break;
    case "error":
      console.log(
        chalk.bold.red(`[${type.toUpperCase()}]`) +
          ` - ` +
          chalk.white.bold(date.format(now, "HH:mm")) +
          `: ` +
          message
      );
      break;
    default:
      console.log(
        chalk.bold.blue(`[${type.toUpperCase()}]`) +
          ` - ` +
          chalk.white.bold(date.format(now, "HH:mm")) +
          `: ` +
          chalk.bold.red(username) +
          `: ` +
          message
      );
  }
}

async function tasksCompleted(client, channel, tasks, pokemon) {
  channel.send("<@716390085896962058> order iv");
  const marketOutstanding = market[client.user.username]?.length || 0;
  sendLog(
    client.user.username,
    `Tasks succesfully completed, got ${marketOutstanding} market orders outstanding, ${
      tasks[client.user.username].trade
    } trades left to do.`,
    "success"
  );
  done++;
  if (tasks[client.user.username].spend > 0) {
    sendLog(
      client.user.username,
      `No listings found from your other accounts to buy, or not enough Pokécoins present, please run again or manually buy a listing.`,
      "error"
    );
  }
}

sendLog(
  null,
  `Logging in with ${chalk.green.bold(tokens.length)} account(s)`,
  "info"
);
