import {
	slash,
	ApplicationCommandsModule,
	ApplicationCommandInteraction,
	Extension,
	CommandClient,
	event,
	Interaction,
	isMessageComponentInteraction,
	Embed,
} from "harmony";
import { UnoGame, games } from "game";
import { ButtonInteraction } from "interaction";

let interactionMethods: ButtonInteraction[] = [];

export default class Interactions extends Extension {
	constructor(client: CommandClient) {
		super(client);
		this.loadEvents();
		const module = new SlashCommands();
		module.commands = module.commands.map((cmd) => {
			client.interactions.handle({
				handler: cmd.handler,
				name: cmd.name,
			});
			return cmd;
		});
	}

	async loadEvents() {
		for await (const { isFile, name } of Deno.readDir("./interactions")) {
			if (isFile && (name.endsWith(".ts") || name.endsWith(".tsx"))) {
				const ext = (await import(`../interactions/${name}`)).default;
				interactionMethods.push(new ext());
			}
		}
		interactionMethods = interactionMethods.sort(
			(a, b) => a.priorty - b.priorty
		);
	}

	@event()
	async interactionCreate(_ext: this, i: Interaction) {
		if (!isMessageComponentInteraction(i)) return;
		if (i.message.author.id != this.client.user!.id) return;
		if (i.guild == undefined) return;

		// Temporary fix
		i.editResponse = i.reply;

		for (const method of interactionMethods) {
			const res = await method.execute(i);
			if (typeof res == "boolean") {
				if (res == false) return;
			}
		}
	}
}

export class SlashCommands extends ApplicationCommandsModule {
	@slash()
	async help(i: ApplicationCommandInteraction) {
		await i.reply({
			ephemeral: true,
			embeds: [
				new Embed({
					...UnoGame.embedTemplate,
					title: "DisUNO",
					description: "A discord bot to play uno using discord's buttons",
					fields: [
						{
							name: "Author",
							value: "[Blocks_n_more#5526](https://github.com/blocksnmore)",
							inline: true,
						},
						{
							name: "Source",
							value: "[Github](https://github.com/blocksnmore/disuno)",
							inline: true,
						},
						{
							name: "Discord Library",
							value: "[Harmony](https://deno.land/x/harmony)",
							inline: true,
						},
					],
				}).setColor("RED"),
			],
		});
	}

	@slash()
	async createpanel(i: ApplicationCommandInteraction) {
		if (
			i.member != undefined &&
			i.channel != undefined &&
			i.member.permissions.has("MANAGE_SERVER")
		) {
			const { message } = await i.reply(UnoGame.getPanelEmbed());

			try {
				i.channel.pinMessage(message!.id);
			} catch {
				// Failed to pin, do nothing
			}
		} else {
			await i.reply({
				ephemeral: true,
				embeds: [
					new Embed({
						...UnoGame.embedTemplate,
						title: "Missing permission!",
						description:
							"You need the `MANAGE_SERVER` permission to create a game.",
					}).setColor("RED"),
				],
			});
		}
	}

	@slash()
	async stop(i: ApplicationCommandInteraction) {
		if (
			i.member != undefined &&
			i.channel != undefined &&
			i.member.permissions.has("MANAGE_SERVER")
		) {
			if (games.has(i.guild!.id)) {
				const game = games.get(i.guild!.id)!;
				game.stopGame(false);
				games.delete(i.guild!.id);
				await i.reply({
					ephemeral: true,
					embeds: [
						new Embed({
							...UnoGame.embedTemplate,
							title: "Game stopped!",
							description: "The game has been stopped",
						}).setColor("RED"),
					],
				});
			} else {
				await i.reply({
					ephemeral: true,
					embeds: [
						new Embed({
							...UnoGame.embedTemplate,
							title: "No game running!",
							description: "There is no game currently running!",
						}).setColor("RED"),
					],
				});
			}
		} else {
			await i.reply({
				ephemeral: true,
				embeds: [
					new Embed({
						...UnoGame.embedTemplate,
						title: "Missing permission!",
						description:
							"You need the `MANAGE_SERVER` permission to stop a game.",
					}).setColor("RED"),
				],
			});
		}
	}
}
