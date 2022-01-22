import { ButtonInteraction } from "interaction";
import {
	MessageComponentInteraction,
	Embed,
	fragment,
	BotUI,
	ActionRow,
	Button,
} from "harmony";
import { games, UnoGame, cardColorToEmbedColor, cardToButtonId } from "game";
import { CardColor, DeckCard, CardType } from "cards";

export default class ManageGame extends ButtonInteraction {
	priorty = 5;

	async execute(i: MessageComponentInteraction) {
		if (i.guild == undefined) return false;
		const game = games.get(i.guild.id)!;

		const hasColor = (color: CardColor) => {
			for (const card of game.fetchPlayer(i.user.id)!.cards) {
				if (card.color == color) return true;
			}
			return false;
		};

		const shouldNotBeDisabled = (color: CardColor) => {
			if (!hasColor(color)) return false;
			for (const card of game.fetchPlayer(i.user.id)!.cards) {
				if (playableCard(card)) return true;
			}

			return false;
		};

		const playableCard = (card: DeckCard) => game.isPlayableCard(card);

		switch (i.customID) {
			case "hand": {
				await i.reply({
					ephemeral: true,
					embeds: [
						new Embed({
							...UnoGame.embedTemplate,
							title: "Your hand",
							description: "Select a color to view/play",
						}).setColor(cardColorToEmbedColor(game.lastPlayedCard.color)),
					],
					components: (
						<>
							<ActionRow>
								<Button
									style="red"
									id="v-r"
									label="Red"
									disabled={!shouldNotBeDisabled(CardColor.RED)}
								/>
								<Button
									style="green"
									id="v-g"
									label="Green"
									disabled={!shouldNotBeDisabled(CardColor.GREEN)}
								/>
								<Button
									style="grey"
									id="v-y"
									label="Yellow"
									disabled={!shouldNotBeDisabled(CardColor.YELLOW)}
								/>
								<Button
									style="blurple"
									id="v-b"
									label="Blue"
									disabled={!shouldNotBeDisabled(CardColor.BLUE)}
								/>
								<Button
									style="grey"
									id="v-w"
									label="Wild"
									disabled={!shouldNotBeDisabled(CardColor.WILD)}
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

				const buttons = <></>;
				let currentArray = <></>;

				for (const key in cards) {
					const cardCount = cards[key];
					currentArray.push(
						<Button
							style={
								(color == CardColor.YELLOW || color == CardColor.WILD
									? "grey"
									: color == CardColor.BLUE
									? "blurple"
									: color.toString().toLowerCase()) as
									| "red"
									| "blurple"
									| "green"
									| "grey"
							}
							id={cardToButtonId({ type: key as CardType, color })}
							label={`${key} ${cardCount > 1 ? `x${cardCount}` : ""}`}
							disabled={!playableCard({ type: key as CardType, color })}
						/>
					);

					if (currentArray.length == 5) {
						buttons.push(<ActionRow>{currentArray}</ActionRow>);
						currentArray = <></>;
					}
				}

				if (currentArray.length > 0) {
					buttons.push(<ActionRow>{currentArray}</ActionRow>);
				}

				await i.editResponse({
					embeds: [
						new Embed({
							...UnoGame.embedTemplate,
							title: "Your hand",
							description: "Select a card to play",
						}).setColor(cardColorToEmbedColor(color)),
					],
					components: buttons,
				});

				return false;
			}

			default: {
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
	}
}
