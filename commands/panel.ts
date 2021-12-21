import { Embed, ApplicationCommandInteraction } from "harmony";
import { SlashCommand } from "command";

export default class CreatePanel extends SlashCommand {
	name = "createpanel";
	description = "Create an UNO panel";

	async handle(i: ApplicationCommandInteraction) {
		if (i.member == undefined || i.guild == undefined || i.channel == undefined) return;

		if (i.member.permissions.has("MANAGE_GUILD")) {
			const embed = new Embed({
				author: {
					name: "UNO Panel",
				},
				title: "Create a game of UNO!",
				description: "To create a game of UNO press the button below!",
			});

			const _message = await i.reply({
				embeds: [embed],
				components: [
					{
						type: 1,
						components: [
							{
								type: 2,
								label: "Create game",
								customID: "creategame",
								style: "GREEN",
							},
						],
					},
				],
			});
			// bug in harmony
			// i.channel.pinMessage(message.id)
		} else {
			i.reply({
				ephemeral: true,
				content: "You don't have permission to do that.",
			});
		}
	}
}
