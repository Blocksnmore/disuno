import { ButtonInteraction } from "interaction";
import {
	MessageComponentInteraction,
	Embed,
	fragment,
	BotUI,
	ActionRow,
	Button,
	MessageComponentPayload,
	ButtonStyle,
} from "harmony";
import {
	games,
	UnoGame,
	cardColorToEmbedColor,
	cardToButtonId,
	formatString,
} from "game";
import { CardColor, DeckCard, CardType } from "cards";

export default class ManageGame extends ButtonInteraction {
	priorty = 4;

	async execute(i: MessageComponentInteraction) {
		if (i.guild == undefined) return false;
		const game = games.get(i.guild.id)!;
		if (game.fetchPlayer(i.user.id)?.cards == undefined) return;

		const shouldBeDisabled = (color: CardColor) => {
			for (const card of game.fetchPlayer(i.user.id)!.cards) {
				if (card.color == color) return false;
			}
			return true;
		}


		const playableCard = (card: DeckCard) => game.isPlayableCard(card);

		switch (i.customID) {
			case "hand": {
				await i.reply({
					ephemeral: true,
					embeds: [
						new Embed({
							...UnoGame.embedTemplate,
							title: "Your hand",
							description:
								"Select a color to view/play\nTo refresh this page click the `View Cards` button again.",
						}).setColor(cardColorToEmbedColor(game.lastPlayedCard.color)),
					],
					components: (
						<>
							<ActionRow>
								<Button
									style="red"
									id="v-r"
									label={`Red x${
										game
											.fetchPlayer(i.user.id)!
											.cards.filter(({ color }) => color == CardColor.RED)
											.length
									}`}
									disabled={shouldBeDisabled(CardColor.RED)}
								/>
								<Button
									style="green"
									id="v-g"
									label={`Green x${
										game
											.fetchPlayer(i.user.id)!
											.cards.filter(({ color }) => color == CardColor.GREEN)
											.length
									}`}
									disabled={shouldBeDisabled(CardColor.GREEN)}
								/>
								<Button
									style="grey"
									id="v-y"
									label={`Yellow x${
										game
											.fetchPlayer(i.user.id)!
											.cards.filter(({ color }) => color == CardColor.YELLOW)
											.length
									}`}
									disabled={shouldBeDisabled(CardColor.YELLOW)}
								/>
								<Button
									style="blurple"
									id="v-b"
									label={`Blue x${
										game
											.fetchPlayer(i.user.id)!
											.cards.filter(({ color }) => color == CardColor.BLUE)
											.length
									}`}
									disabled={shouldBeDisabled(CardColor.BLUE)}
								/>
								<Button
									style="grey"
									id="v-w"
									label={`Wild x${
										game
											.fetchPlayer(i.user.id)!
											.cards.filter(({ color }) => color == CardColor.WILD)
											.length
									}`}
									disabled={shouldBeDisabled(CardColor.WILD)}
								/>
							</ActionRow>
						</>
					),
				});
				return false;
			}

			case "v-g":
			case "v-r":
			case "v-b":
			case "v-y":
			case "v-w": {
				const key = i.customID.substring(2);
				const color =
					key == "r"
						? CardColor.RED
						: key == "g"
						? CardColor.GREEN
						: key == "b"
						? CardColor.BLUE
						: key == "y"
						? CardColor.YELLOW
						: CardColor.WILD;

				const cards: { [key: string]: number } = {};

				for (const card of game.fetchPlayer(i.user.id)!.cards) {
					if (card.color != color) continue;
					cards[card.type] = cards[card.type] ?? 1;
				}

				const buttons: MessageComponentPayload[] = [];
				let currentArray: MessageComponentPayload[] = [];

				for (const key in cards) {
					const cardCount = game.fetchPlayer(i.user.id)!.cards.filter((c) => c.type == key && c.color == color).length;
					currentArray.push({
						type: 2,
						style:
							color == CardColor.YELLOW || color == CardColor.WILD
								? ButtonStyle.GREY
								: color == CardColor.BLUE
								? ButtonStyle.BLURPLE
								: color == CardColor.RED
								? ButtonStyle.RED
								: ButtonStyle.GREEN,
						custom_id: cardToButtonId({
							type: key.replace(/-/g, "_") as CardType,
							color,
						}),
						label: `${formatString(key.replace(/_/g, " "))} ${cardCount > 1 ? `x${cardCount}` : ""}`,
						disabled: !playableCard({ type: key as CardType, color }),
					});

					if (currentArray.length == 5) {
						buttons.push({ type: 1, components: currentArray });
						currentArray = [];
					}
				}

				if (currentArray.length > 0) {
					buttons.push({ type: 1, components: currentArray });
				}

				await i.editResponse({
					ephemeral: true,
					embeds: [
						new Embed({
							...UnoGame.embedTemplate,
							title: "Your hand",
							description:
								"Select a card to play\nTo refresh this menu click the `View Card` button again.",
						}).setColor(cardColorToEmbedColor(color)),
					],
					components: buttons,
				});

				return false;
			}
		}
	}
}
