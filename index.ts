import { CommandClient, GatewayIntents } from "harmony";
import Commands from "commands";
import "https://deno.land/x/dotenv@v3.1.0/load.ts";

const bot = new CommandClient({
	prefix: [],
	owners: ["314166178144583682"],
	presence: {
		status: "online",
		activity: {
			name: "UNO on discord! | /help",
			type: "PLAYING",
		},
	},
	allowDMs: false,
	allowBots: false,
	shardCount: "auto",
});

bot.on("ready", async () => {
	console.log(
		`DisUNO online as ${bot.user!.tag} in ${await bot.guilds.size()} servers!`
	);
	if ((await bot.interactions.commands.all()).size != Commands.length) {
		bot.interactions.commands.bulkEdit(Commands);
	}
});

for await (const { isFile, name } of Deno.readDir("./extensions")) {
	if (isFile && (name.endsWith(".ts") || name.endsWith(".tsx"))) {
		const extension = (await import(`./extensions/${name}`)).default;

		bot.extensions.load(extension);
	}
}

bot.connect(Deno.env.get("TOKEN"), [
	// /createpanel doesn't work without all 4, no clue why
	GatewayIntents.GUILDS,
	GatewayIntents.GUILD_MESSAGES,
	GatewayIntents.GUILD_PRESENCES,
	GatewayIntents.GUILD_MEMBERS,
]);
