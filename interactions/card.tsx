import { ButtonInteraction } from "interaction";
import {
	MessageComponentInteraction,
	Embed,
	BotUI,
	fragment,
	ActionRow,
	Button,
} from "harmony";
import { games, UnoGame, formatString, cardIdToCard, cardToString } from "game";
import { CardColor, CardType } from "cards";

export default class ManageGame extends ButtonInteraction {
	priorty = 4;

	async execute(i: MessageComponentInteraction) {
		if (i.guild == undefined) return false;
		const game = games.get(i.guild.id)!;

		if (/w4?-(ylw|grn|blu|red)/i.test(i.customID)) {
			const plusFour = /w4-/i.test(i.customID);
			const color = i.customID.substring(3);

			if (game.currentPlayer.id != i.user.id) {
				await i.editResponse({
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
				const selectedColor =
					color == "ylw"
						? CardColor.YELLOW
						: color == "grn"
						? CardColor.GREEN
						: color == "blu"
						? CardColor.BLUE
						: CardColor.RED;

				game.playCard({
					color: selectedColor,
					type: plusFour ? CardType.WILD_DRAW_FOUR : CardType.WILD,
				});

				await i.editResponse({
					embeds: [
						new Embed({
							...UnoGame.embedTemplate,
							title: "Card played!",
							description: `You have played a ${formatString(selectedColor)} ${
								plusFour ? "+4" : "Wild"
							} card!`,
						}).setColor("GREEN"),
					],
					components: [],
				});
			}

			return false;
		}

		const card = cardIdToCard(i.customID);
		if (card != undefined) {
			if (game.currentPlayer.id != i.user.id) {
				await i.editResponse({
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
				if (game.isPlayableCard(card)) {
					if (card.color == CardColor.WILD) {
						const id = `${card.type == CardType.WILD_DRAW_FOUR ? "w4" : "w"}-`;
						await i.editResponse({
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
										<Button style="red" label="Red" id={`${id}-red`} />
										<Button style="green" label="Green" id={`${id}-grn`} />
										<Button style="grey" label="Yellow" id={`${id}-ylw`} />
										<Button style="blurple" label="Blue" id={`${id}-blu`} />
									</ActionRow>
								</>
							),
						});
					} else {
						game.playCard(card);
						
						await i.editResponse({
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
			}
			return false;
		}
	}
}
