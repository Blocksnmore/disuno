import {
	CommandClient,
	GatewayIntents,
	CommandClientOptions,
	event,
	SlashBuilder,
	ApplicationCommandPartial,
} from "harmony";
import { SlashCommand } from "command";
import "https://deno.land/x/dotenv@v3.1.0/load.ts";

class Bot extends CommandClient {
	constructor(options: CommandClientOptions) {
		super(options);
		SlashBuilder;
	}

	@event()
	public async ready() {
		console.log(`Online in ${await this.guilds.size()} servers`);
		const commands: Array<ApplicationCommandPartial & { id?: string }> = [];

		for await (const command of Deno.readDir("./commands")) {
			if (command.isFile) {
				const cmd = new (
					await import(`./commands/${command.name}`)
				).default() as SlashCommand;

				commands.push({
					name: cmd.name,
					description: cmd.description ?? "No description provided.",
				});

				this.interactions.handle({
					name: cmd.name,
					handler: cmd.handle,
				});
			}
		}

		if (
			(await this.interactions.commands.guild("688115766867918950")).array()
				.length != commands.length
		) {
			await this.interactions.commands.bulkEdit(commands, "688115766867918950");
		}

		console.log("Loaded all commands");
	}
}

new Bot({
	prefix: [],
	owners: ["314166178144583682"],
	presence: {
		status: "online",
		activity: {
			name: "UNO on discord! | Mention for help",
			type: "PLAYING",
		},
	},
	mentionPrefix: true,
	allowDMs: false,
	spacesAfterPrefix: true,
	shardCount: "auto",
	caseSensitive: false,
}).connect(Deno.env.get("TOKEN"), [
	GatewayIntents.GUILDS,
	GatewayIntents.GUILD_MEMBERS,
	GatewayIntents.GUILD_MESSAGES,
]);
