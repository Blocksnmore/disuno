import {
	Message,
	Embed,
	BotUI,
	fragment,
	ActionRow,
	Button,
} from "../harmony.ts";
import { DeckType, decks } from "../deck.ts";
import { DeckCard, CardColor, CardType } from "../cards.ts";
import { UnoPlayer, UnoGameState } from "./interfaces.ts";
import {
	getRandomUnoColor,
	shuffleArray,
	getRandomInteger,
	cardColorToEmbedColor,
	cardToString,
	removeDiscriminator,
	sleep,
} from "./utils.ts";
import { games } from "./index.ts";

export class UnoGame {
	// Cards in deck
	public gameDeck: DeckCard[] = [];
	// Players
	public players: UnoPlayer[] = [];
	// Amount of cards in a stack
	private drawAmount = 0;
	// Order
	private orderDown = true;
	// Order number
	private orderIndex = 0;
	// Game state
	public gameState = UnoGameState.LOBBY;
	// Starting card amount
	private startingCards = 7;
	// Current card - Gets replaced on start
	private lastPlayedCard: DeckCard = this.gameDeck[0];
	// Action log
	public lastAction = "Game started";

	constructor(
		private readonly guildId: string,
		public hostId: string,
		readonly hostUsername: string,
		private readonly message: Message,
		private readonly deck: DeckType
	) {
		this.gameDeck = [...deck.cards.cards];
		this.addPlayer(hostId, hostUsername);
		games.set(guildId, this);
		this.showLobbyEmbed();
	}

	public addPlayer(id: string, name: string) {
		this.players.push({
			id,
			name,
			calledUno: false,
			cards: [],
			candraw: true,
		});
	}

	public async startGame() {
		this.gameState = UnoGameState.PLAYING;
		await this.message.edit({
			embeds: [
				new Embed({
					...UnoGame.embedTemplate,
					title: "Twhoop!",
					description: "Shuffling the deck...",
				}),
			],
		});

		for (const _entry of new Array(getRandomInteger(5, 10))) {
			this.players = shuffleArray(this.players);
			this.gameDeck = shuffleArray(this.gameDeck);
		}

		await sleep(getRandomInteger(1000, 2000));

		this.distributeCards();
		this.showGameEmbed();
	}

	public isPlayableCard({ color, type }: DeckCard) {
		if (type == CardType.WILD_DRAW_FOUR) return true;

		if (this.drawAmount < 1) {
			if (color == this.lastPlayedCard.color) return true;
			if (type == this.lastPlayedCard.type) return true;
			if (color == CardColor.WILD) return true;
		} else {
			if (
				this.lastPlayedCard.type == CardType.DRAW_TWO &&
				type == CardType.DRAW_TWO
			)
				return true;
		}

		return false;
	}

	public playCard({ color, type }: DeckCard) {
		if ([CardType.WILD_DRAW_FOUR, CardType.WILD].includes(type)) {
			color = CardColor.WILD;
		}

		this.gameDeck.push(this.lastPlayedCard);
		this.lastPlayedCard = { color, type };
		this.currentPlayer.candraw = true;

		switch (type) {
			case CardType.SKIP: {
				this.lastAction = `${removeDiscriminator(
					this.currentPlayer.name
				)} skipped ${removeDiscriminator(this.nextPlayer.name)}`;
				this.nextTurn(false);
				break;
			}

			case CardType.REVERSE: {
				this.lastAction = `${removeDiscriminator(
					this.currentPlayer.name
				)} reversed the order`;
				this.orderDown = !this.orderDown;
				break;
			}

			case CardType.DRAW_TWO: {
				this.lastAction = `${removeDiscriminator(this.currentPlayer.name)} ${
					this.drawAmount < 1 ? "played" : "stacked"
				} a Plus 2!`;
				this.drawAmount += 2;
				break;
			}

			case CardType.WILD: {
				this.lastAction = `${removeDiscriminator(this.currentPlayer.name)} ${
					this.drawAmount < 1 ? "played" : "stacked"
				} a Plus 4!`;
				this.drawAmount += 4;
				break;
			}

			default: {
				break;
			}
		}

		this.nextTurn();
	}

	public nextTurn(show = true) {
		if (this.orderDown) {
			this.orderIndex--;
			if (this.orderIndex < 0) {
				this.orderIndex = this.players.length - 1;
			}
		} else {
			this.orderIndex++;
			if (this.orderIndex >= this.players.length) {
				this.orderIndex = 0;
			}
		}

		if (this.drawAmount > 0) {
			if (!this.doesCurrentPlayerHaveValidPlusCard()) {
				this.givePlayerCards(this.drawAmount);
				this.drawAmount = 0;
				this.lastAction += ` Making ${removeDiscriminator(
					this.currentPlayer.name
				)} draw ${this.drawAmount} cards and skipping their turn.`;
				this.nextTurn(show);
				return;
			}
		}

		if (show) this.showGameEmbed();
	}

	private doesCurrentPlayerHaveValidPlusCard() {
		for (const card of this.currentPlayer.cards) {
			if (card.type == CardType.WILD_DRAW_FOUR) return true;
			if (
				card.type == CardType.DRAW_TWO &&
				this.lastPlayedCard.type == CardType.DRAW_TWO
			)
				return true;
		}
		return false;
	}

	private givePlayerCards(amount: number, player = this.currentPlayer) {
		for (const _entry of new Array(amount)) {
			const card = this.gameDeck.pop();
			if (card == undefined) return;
			player.cards.push(card);
			this.gameDeck = shuffleArray(this.gameDeck);
		}
	}

	private distributeCards() {
		for (const card of this.gameDeck) {
			// Impossible to start on a special card
			if (
				[
					CardColor.BLUE,
					CardColor.GREEN,
					CardColor.RED,
					CardColor.YELLOW,
				].includes(card.color) &&
				[
					CardType.ZERO,
					CardType.ONE,
					CardType.TWO,
					CardType.THREE,
					CardType.FOUR,
					CardType.FIVE,
					CardType.SIX,
					CardType.SEVEN,
					CardType.EIGHT,
					CardType.NINE,
				].includes(card.type)
			) {
				this.lastPlayedCard = card;
				return;
			}
		}

		for (const player of this.players) {
			player.cards = [];
			this.givePlayerCards(this.startingCards, player);
		}
	}

	private async showLobbyEmbed() {
		await this.message.edit({
			embeds: [
				new Embed({
					...UnoGame.embedTemplate,
					title: "Uno lobby",
					description: `<@!${this.hostId}> is hosting a game of uno! \nClick the \`Join game\` button to join!`,
					fields: [
						{
							name: "Players",
							value: this.players
								.map(({ id }) => `${id == this.hostId ? "👑" : "👤"} <@!${id}>`)
								.join("\n"),
						},
					],
					footer: {
						text: `Players needed to start: 3 | Player count: ${this.players.length}`,
					},
				}),
			],
			components: (
				<>
					<ActionRow>
						<Button style="green" label="Start game" id="start" />
						<Button style="blurple" label="Join game" id="join" />
						<Button style="red" label="Leave game" id="leave" />
						<Button style="red" label="Cancel game" id="cancel" />
					</ActionRow>
				</>
			),
		});
	}

	public async showGameEmbed(mention = true) {
		await this.message.edit({
			embeds: [
				new Embed({
					...UnoGame.embedTemplate,
					title: "Uno game",
					fields: [
						{
							name: "Last played card",
							value: `\`${cardToString(this.lastPlayedCard)}\``,
							inline: true,
						},
						{
							name: "Current player",
							value: `<@!${this.currentPlayer.id}>`,
						},
						{
							name: "Action log",
							value: `\`${this.lastAction}\``,
							inline: true,
						},
						{
							name: "Current Plus Stack",
							value: `\`${this.drawAmount} Card${
								this.drawAmount !== 1 ? "s" : ""
							}\``,
						},
						{
							name: `Order ${this.orderDown ? "⬇" : "⬆"}`,
							value: this.players
								.map(
									({ id, cards }) =>
										`${
											id == this.currentPlayer.id ? "▶" : "🟦"
										} <@!${id}> - \`${cards.length} Cards\``
								)
								.join("\n"),
						},
					],
				}).setColor(cardColorToEmbedColor(this.lastPlayedCard.color)),
			],
			components: (
				<>
					<ActionRow>
						<Button style="blurple" label="View cards" id="hand" />
						<Button style="red" label="Draw cards" id="draw" />
						<Button style="red" label="Leave game" id="leave" />
						<Button
							style="grey"
							label="Call UNO!"
							id="callout"
							disabled={
								this.players.filter(
									({ cards, calledUno }) => cards.length === 1 && !calledUno
								).length > 0
							}
						/>
					</ActionRow>
				</>
			),
		});

		if (mention == true) {
			const msg = await this.message.channel.send(
				`<@!${this.currentPlayer.id}>`
			);
			await msg.delete();
		}
	}

	public get currentPlayer() {
		return this.players[this.orderIndex];
	}

	private get nextPlayer() {
		let number = this.orderIndex + (this.orderDown ? 1 : -1);
		if (number < 0) number = this.players.length - 1;
		if (number >= this.players.length) number = 0;
		return this.players[number];
	}

	private fetchPlayer(user: string) {
		return this.players.find(({ id }) => id == user);
	}

	public isPlayerInGame(user: string) {
		return this.fetchPlayer(user) != undefined;
	}

	public stopGame(wasHost: boolean) {
		this.gameState = UnoGameState.END;
		this.gameState = UnoGameState.END;
		this.message.edit(UnoGame.getPanelEmbed(wasHost ? "host" : "admin"));
		games.delete(this.guildId);
	}

	public onPlayerQuit(user: string) {
		this.gameDeck = [...this.gameDeck, ...this.fetchPlayer(user)!.cards];
		this.players = this.players.filter(({ id }) => id != user);

		if (this.hostId == user) {
			this.hostId = this.players[0].id;
		}

		if (
			this.players.length == 0 ||
			(this.gameState == UnoGameState.PLAYING && this.players.length == 1)
		) {
			this.gameState = UnoGameState.END;
			this.message.edit(UnoGame.getPanelEmbed("quit"));
			games.delete(this.guildId);
		} else {
			switch (this.gameState) {
				case UnoGameState.LOBBY: {
					return this.showLobbyEmbed();
				}

				case UnoGameState.PLAYING: {
					if (this.currentPlayer.id == user) {
						this.nextTurn(false);
					}
					return this.showGameEmbed(false);
				}
			}
		}
	}

	// Static methods

	public static getPanelEmbed(canceledBy?: "admin" | "host" | "quit") {
		return {
			embeds: [
				new Embed({
					...UnoGame.embedTemplate,
					title: "Discord UNO",
					description: "To create a game select the deck from below",
					footer: {
						text:
							canceledBy == undefined
								? ""
								: `Game canceled ${
										canceledBy == "quit"
											? "due to everyone leaving"
											: `by ${canceledBy}`
								  }`,
					},
				}),
			],
			components: (
				<>
					<ActionRow>
						{decks
							.filter(({ cards: { amount } }) => amount > 0)
							.map(({ id, name }) => (
								<Button style="blurple" label={name} id={`d-${id}`} />
							))}
					</ActionRow>
				</>
			),
		};
	}

	static get embedTemplate() {
		return new Embed({
			author: {
				name: "DisUno!",
			},
		})
			.setColor(getRandomUnoColor())
			.toJSON();
	}
}
