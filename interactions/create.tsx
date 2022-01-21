import { ButtonInteraction } from "interaction";
import {
	MessageComponentInteraction,
	Embed,
} from "harmony";
import { games, UnoGame, deckIdToDeck } from "game";

export default class ManageGame extends ButtonInteraction {
	priorty = 1;

	async execute(i: MessageComponentInteraction) {
		if (i.guild == undefined) return false;

		if (i.customID.startsWith("d-")) {
			const deck = deckIdToDeck(i.customID.substring(2));

			if (games.has(i.guild.id)) {
				await i.reply({
					ephemeral: true,
					embeds: [
						new Embed({
							...UnoGame.embedTemplate,
							title: "Unable to create game",
							description: "A game has already been created for this server.",
						}).setColor("RED"),
					],
				});
			} else {
				if (deck == undefined) {
					await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								...UnoGame.embedTemplate,
								title: "Unknown deck!",
								description: "The deck you selected does not exist.",
							}).setColor("RED"),
						],
					});
				} else {
					new UnoGame(i.guild.id, i.user.id, i.user.tag, i.message, deck);
					await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								...UnoGame.embedTemplate,
								title: "Game created",
								description: "Game has been created!",
							}).setColor("GREEN"),
						],
					});
				}
			}
			return false;
		}
	}
}
