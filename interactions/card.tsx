import { ButtonInteraction } from "interaction";
import {
	MessageComponentInteraction,
	Embed,
	BotUI,
	fragment,
	ActionRow,
	Button,
} from "harmony";
import { games, UnoGame, cardIdToCard, cardToString, cardToButtonId } from "game";
import { CardColor } from "cards";

export default class ManageGame extends ButtonInteraction {
	priorty = 5;

	async execute(i: MessageComponentInteraction) {
		if (i.guild == undefined) return false;
		const game = games.get(i.guild.id)!;

		const card = cardIdToCard(i.customID);
		if (
			card != undefined &&
			card.type != undefined &&
			card.color != undefined
		) {
			if (game.currentPlayer.id != i.user.id) {
				await i.editResponse({
					ephemeral: true,
					embeds: [
						new Embed({
							...UnoGame.embedTemplate,
							title: "Unable to play card",
							description: "It is not your turn.",
						}).setColor("RED"),
					],
					components: [],
				});
			} else {
				if (game.doesCurrentPlayerHaveCard(card)) {
					if (game.isPlayableCard(card)) {
						if (card.color == CardColor.WILD) {
							await i.editResponse({
								ephemeral: true,
								embeds: [
									new Embed({
										...UnoGame.embedTemplate,
										title: "Select a color!",
										description: "Select a color to set the wild card to!",
									}).setColor("LIGHT_GREY"),
								],
								components: (
									<>
										<ActionRow>
											<Button style="red" label="Red" id={cardToButtonId({
												color: CardColor.RED,
												type: card.type
											})} />
											<Button style="green" label="Green" id={cardToButtonId({
												color: CardColor.GREEN,
												type: card.type
											})} />
											<Button style="grey" label="Yellow" id={cardToButtonId({
												color: CardColor.YELLOW,
												type: card.type
											})} />
											<Button style="blurple" label="Blue" id={cardToButtonId({
												color: CardColor.BLUE,
												type: card.type
											})} />
										</ActionRow>
									</>
								),
							});
						} else {
							game.playCard(card);

							await i.editResponse({
								ephemeral: true,
								embeds: [
									new Embed({
										...UnoGame.embedTemplate,
										title: "Card played!",
										description: `You have played a \`${cardToString(card)}\`!`,
									}).setColor("GREEN"),
								],
								components: [],
							});
						}
					} else {
						await i.editResponse({
							ephemeral: true,
							embeds: [
								new Embed({
									...UnoGame.embedTemplate,
									title: "Unable to play!",
									description: `You cannot play a \`${cardToString(
										card
									)}\` on top of a \`${cardToString(game.lastPlayedCard)}\` ${
										game.drawAmount > 0 ? "due to stacking" : ""
									}`,
								}).setColor("RED"),
							],
							components: [],
						});
					}
				} else {
					await i.editResponse({
						ephemeral: true,
						embeds: [
							new Embed({
								...UnoGame.embedTemplate,
								title: "Unable to play card",
								description: "You do not have this card in your deck!",
							}).setColor("RED"),
						],
					});
				}
			}
			return false;
		}
		console.log(i.customID);
		await i.reply({
			ephemeral: true,
			embeds: [
				new Embed({
					...UnoGame.embedTemplate,
					title: "Unable to complete action",
					description:
						"Sorry, this action is unknown so it could not be completed.",
				}).setColor("RED"),
			],
		});
		return false;
	}
}
