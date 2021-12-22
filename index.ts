import {
	CommandClient,
	GatewayIntents,
	CommandClientOptions,
	event,
	SlashBuilder,
} from "harmony";
import "https://deno.land/x/dotenv@v3.1.0/load.ts";

class Bot extends CommandClient {
	constructor(options: CommandClientOptions) {
		super(options);
		SlashBuilder;
	}

	@event()
	public async ready() {
		console.log(`Online in ${await this.guilds.size()} servers`);
	}
}

const bot = new Bot({
	prefix: [],
	owners: ["314166178144583682"],
	presence: {
		status: "online",
		activity: {
			name: "UNO on discord! | /help",
			type: "PLAYING",
		},
	},
	mentionPrefix: true,
	allowDMs: false,
	spacesAfterPrefix: true,
	shardCount: "auto",
	caseSensitive: false,
});

for await (const command of Deno.readDir("./modules")) {
	if (command.isFile) {
		const cmd = (await import(`./modules/${command.name}`)).default;

		bot.extensions.load(cmd);
	}
}

bot.connect(Deno.env.get("TOKEN"), [
	GatewayIntents.GUILDS,
	GatewayIntents.GUILD_MESSAGES,
	GatewayIntents.GUILD_PRESENCES,
	GatewayIntents.GUILD_MEMBERS,
]);
