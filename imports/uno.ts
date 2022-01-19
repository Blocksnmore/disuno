import {
	Embed,
	MessageComponentBase,
	ButtonStyle,
	User,
	Message,
	Client,
	Interaction,
	MessageComponentPayload,
} from "./harmony.ts";
import { decks, DeckType } from "./deck.ts";
import { DeckCard, CardType, CardColor } from "./cards.ts";

interface UnoPlayer {
	id: string;
	username: string;
	calledUno: boolean;
	cards: DeckCard[];
}

export class UnoGame {
	public players: UnoPlayer[] = [];
	private playerIndex = -1;
	private clockwiseOrder = true;
	public message?: Message;
	public started = false;
	public lastCardPlayed?: DeckCard;
	public deck: DeckCard[];
	public startingCards = 7;
	/** For card stacking */
	public drawAmount = 0;

	constructor(
		public creator: {
			name: string;
			id: string;
			user: User;
		},
		private client: Client,
		deckType: DeckType
	) {
		this.addPlayer(creator.id, creator.name);
		this.deck = decks.find((d) => d.id === deckType)!.cards.cards;
		this.shuffleDeck();
	}

	// Utils

	public doesCurrentPlayerHaveCard({ type, color }: DeckCard) {
		for (const card of this.getCurrentPlayer().cards) {
			if (card.type == type && card.color == color) {
				return true;
			}
		}
		return false;
	}

	private doesCurrentPlayerHaveValidPlusCard() {
		for (const card of this.getCurrentPlayer().cards) {
			if (
				card.type == CardType.WILD_DRAW_FOUR ||
				(card.type == CardType.DRAW_TWO &&
					this.lastCardPlayed!.type == CardType.DRAW_TWO)
			) {
				return true;
			}
		}
		return false;
	}

	private shuffle<T>(array: T[]): T[] {
		const newArray: T[] = [];

		for (const item of array) {
			const beforeAfter = Math.floor(Math.random() * 4);

			if (beforeAfter < 2) {
				newArray.push(item);
			} else {
				newArray.unshift(item);
			}
		}

		return newArray;
	}

	public addPlayer(id: string, username: string) {
		this.players.push({
			id,
			username,
			calledUno: false,
			cards: [],
		});
	}

	public formatCardString(str: string) {
		return str.split("_").map(this.format).join(" ");
	}

	private format(str: string) {
		return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
	}

	public cardToString(card: DeckCard) {
		return `${this.format(card.color)} ${this.formatCardString(card.type)}`;
	}

	public getCurrentPlayer() {
		return this.players[this.playerIndex];
	}

	private shuffleDeck() {
		for (let i = Math.floor(Math.random() * 10) + 5; i > 0; i--) {
			this.deck = this.shuffle(this.deck);
		}
	}

	public getPlayer(id: string) {
		return this.players.find((p) => p.id === id);
	}

	public cardColorToEmbedColor(
		color: CardColor
	): "RED" | "GREEN" | "BLUE" | "YELLOW" | "LIGHT_GREY" {
		if (color != CardColor.WILD) {
			return color;
		} else {
			return "LIGHT_GREY";
		}
	}

	public getPlayerIDArray() {
		return this.players.map((p) => p.id);
	}

	public playCard(color: CardColor, type: CardType) {
		const cards = [];
		let cardRemoved = false;
		for (const card of this.getCurrentPlayer().cards) {
			if (
				(([CardType.WILD, CardType.WILD_DRAW_FOUR].includes(card.type) &&
					[CardType.WILD, CardType.WILD_DRAW_FOUR].includes(type)) ||
					(card.type == type && card.color == color)) &&
				!cardRemoved
			) {
				cardRemoved = true;
			} else {
				cards.push(card);
			}
		}
		this.getCurrentPlayer().cards = cards;

		if (type == CardType.DRAW_TWO) {
			this.drawAmount += 2;
		} else if (type == CardType.WILD_DRAW_FOUR) {
			this.drawAmount += 4;
		}

		this.lastCardPlayed = {
			type,
			color,
		};

		this.deck.push({
			type,
			color:
				type == CardType.WILD || type == CardType.WILD_DRAW_FOUR
					? CardColor.WILD
					: color,
		});

		if (type == CardType.SKIP) {
			this.nextTurn();
		}

		if (type == CardType.REVERSE) {
			this.clockwiseOrder = !this.clockwiseOrder;
		}

		// Prevent order stuff
		this.shuffleDeck();

		if (this.getCurrentPlayer().cards.length == 0) {
			return this.onGameEnd();
		}

		this.nextTurn();

		if (!this.doesCurrentPlayerHaveValidPlusCard() && this.drawAmount > 0) {
			this.givePlayerCards(this.drawAmount);
			this.drawAmount = 0;
			this.nextTurn();
		}

		this.showGameEmbed();
	}

	// Events

	public onGameStart() {
		this.shuffleDeck();
		// Randomise order of players
		this.players = this.shuffle(this.players);
		this.distributeCards();
		this.playerIndex++;
		this.started = true;
		this.showGameEmbed();
	}

	// Methods

	public nextTurn() {
		if (this.clockwiseOrder) {
			this.playerIndex++;
			if (this.playerIndex >= this.players.length) {
				this.playerIndex = 0;
			}
		} else {
			this.playerIndex--;
			if (this.playerIndex < 0) {
				this.playerIndex = this.players.length - 1;
			}
		}
	}

	public doesCurrentPlayerHavePlayableCard() {
		if (this.doesCurrentPlayerHaveValidPlusCard()) {
			return true;
		}
		for (const card of this.getCurrentPlayer().cards) {
			if (
				card.color == this.lastCardPlayed!.color ||
				card.color == CardColor.WILD
			) {
				return true;
			}
		}
		return false;
	}

	public givePlayerCards(
		amount: number,
		player: UnoPlayer = this.getCurrentPlayer()
	) {
		for (let i = 0; i < amount; i++) {
			player.cards.push(this.deck.pop()!);
		}
	}

	private distributeCards() {
		const blacklistedStartCards: CardType[] = [
			CardType.DRAW_TWO,
			CardType.WILD_DRAW_FOUR,
			CardType.WILD,
			CardType.REVERSE,
			CardType.SKIP,
		];

		for (let i = 0; i < this.startingCards; i++) {
			for (const player of this.players) {
				if (
					this.lastCardPlayed == undefined &&
					!blacklistedStartCards.includes(this.deck[0].type)
				) {
					this.lastCardPlayed = this.deck[0];
					this.deck.push(this.deck.shift()!);
				}

				player.cards.push(this.deck.shift()!);
			}
		}

		// Incase it didn't manage to get a card from above
		if (this.lastCardPlayed == undefined) {
			let index = -1;

			while (this.lastCardPlayed == undefined) {
				index++;
				const card = this.deck[index];

				if (!blacklistedStartCards.includes(card.type)) {
					this.lastCardPlayed = card;
					this.deck.push(this.deck.shift()!);
					return;
				}
			}
		}
	}

	public stringToCard(card: string): DeckCard {
		const [color, type] = card.toLowerCase().split("-");
		const cardColor = {
			w: CardColor.WILD,
			r: CardColor.RED,
			g: CardColor.GREEN,
			b: CardColor.BLUE,
			y: CardColor.YELLOW,
		}[color] as CardColor;

		const cardType = {
			0: CardType.ZERO,
			1: CardType.ONE,
			2: CardType.TWO,
			3: CardType.THREE,
			4: CardType.FOUR,
			5: CardType.FIVE,
			6: CardType.SIX,
			7: CardType.SEVEN,
			8: CardType.EIGHT,
			9: CardType.NINE,
			reverse: CardType.REVERSE,
			skip: CardType.SKIP,
			plus_2: CardType.DRAW_TWO,
			wild: CardType.WILD,
			plus_4: CardType.WILD_DRAW_FOUR,
		}[type] as CardType;

		return {
			color: cardColor,
			type: cardType,
		};
	}

	public canCardBePlayed({ color, type }: DeckCard) {
		if (type == CardType.WILD_DRAW_FOUR) return true;
		if (this.drawAmount < 1) {
			if (type == this.lastCardPlayed!.type) return true;
			if (color == this.lastCardPlayed!.color) return true;
			if (type == CardType.WILD) return true;
		} else {
			if (type == CardType.DRAW_TWO && this.lastCardPlayed!.type == type)
				return true;
		}

		return false;
	}

	// Messages

	public async onGameEnd() {
		this.started = false;
		await this.message!.edit({
			embeds: [
				new Embed({
					author: {
						name: "Discord Uno",
					},
					title: "Game Over",
					description: `<@!${this.getCurrentPlayer().id}> won the game!`,
					fields: [
						{
							name: "Last played card",
							value: this.cardToString(this.lastCardPlayed!),
						},
						{
							name: "Player standings",
							value: this.players
								.map(
									(p) =>
										`<@!${p.id}> - \`${
											p.id == this.getCurrentPlayer().id
												? "Winner"
												: `${p.cards.length} cards`
										}\``
								)
								.join("\n"),
						},
					],
					footer: {
						text: "This embed will disappear in 10 seconds",
					},
				}).setColor(this.cardColorToEmbedColor(this.lastCardPlayed!.color)),
			],
			components: [],
		});

		setTimeout(() => {
			const { embed, components } = getPanelEmbedAndButtons();
			this.message!.edit({
				embeds: [embed],
				components,
			});
		}, 10000);
	}

	public async showPlayerCards(i: Interaction) {
		const colors: CardColor[] = [];
		const components: MessageComponentPayload[] = [];

		for (const color of [
			CardColor.BLUE,
			CardColor.GREEN,
			CardColor.RED,
			CardColor.YELLOW,
			CardColor.WILD,
		]) {
			const filtered = this.getPlayer(i.user.id)!.cards.filter(
				(c) => c.color === color
			);
			if (filtered.length > 0) {
				colors.push(color);
			}
		}

		for (const color of colors) {
			components.push({
				type: 2,
				label: this.format(color),
				custom_id: color,
				style:
					color == CardColor.BLUE
						? ButtonStyle.BLURPLE
						: color == CardColor.GREEN
						? ButtonStyle.GREEN
						: color == CardColor.RED
						? ButtonStyle.RED
						: ButtonStyle.GREY,
			});
		}

		await i.reply({
			ephemeral: true,
			embeds: [
				new Embed({
					title: "Your cards",
					description: "Select a card category",
				}).setColor(this.cardColorToEmbedColor(this.lastCardPlayed!.color)),
			],
			components: [
				{
					type: 1,
					components,
				},
			],
		});
	}

	public async showGameEmbed(send = true) {
		let canCallUno = false;

		for (const player of this.players) {
			if (player.cards.length == 1 && !player.calledUno) {
				canCallUno = true;
			}
		}

		await this.message!.edit({
			embed: new Embed({
				author: {
					name: "Discord Uno",
				},
				description: `Current turn: <@!${
					this.getCurrentPlayer().id
				}> \nOrder: ${this.clockwiseOrder ? "⬇" : "⬆"}`,
				fields: [
					{
						name: "Current card",
						value: `\`${this.cardToString(this.lastCardPlayed!)}\``,
					},
					{
						name: "Cards:",
						value: this.players
							.map(
								(p) =>
									`${this.getCurrentPlayer().id == p.id ? "▶" : "🟦"} \`${
										p.username
									}: ${p.cards.length}\``
							)
							.join("\n"),
					},
				],
				footer: {
					text: "Press the View cards or Draw button to do an action! | Time limit: 30 seconds",
				},
			}).setColor(this.cardColorToEmbedColor(this.lastCardPlayed!.color)),
			components: [
				{
					type: 1,
					components: [
						{
							type: 2,
							label: "View cards",
							style: ButtonStyle.GREY,
							customID: "view",
						},
						{
							type: 2,
							label: "Draw",
							style: ButtonStyle.RED,
							customID: "draw",
							disabled: this.deck.length == 0,
						},
						{
							type: 2,
							label: 'Call "Uno"',
							style: ButtonStyle.GREEN,
							customID: "call-uno",
							disabled: !canCallUno,
						},
					],
				},
			],
		});

		if (send) {
			const msg = await this.message!.channel.send(
				`<@!${this.getCurrentPlayer().id}>`
			);
			msg.delete();
		}
	}

	public getLobbyEmbedAndButton(): {
		embed: Embed;
		components: MessageComponentBase[];
	} {
		return {
			embed: new Embed({
				title: "Uno Game",
				description: `${this.creator.name} has started a game of UNO!\nTo join their game press the \`Join Game\` button below.`,
				fields: [
					{
						name: "Players",
						value: `${this.players
							.map(
								(u) => `<@!${u.id}>${this.creator.id == u.id ? " - Host" : ""}`
							)
							.join("\n")}`,
					},
				],
				footer: {
					text: "Needed players: 3",
				},
			}).setColor("GREEN"),
			components: [
				{
					type: 1,
					components: [
						{
							type: 2,
							label: "Join Game",
							style: ButtonStyle.BLURPLE,
							custom_id: "join",
						},
						{
							type: 2,
							label: "Start Game",
							style: ButtonStyle.GREEN,
							custom_id: "start",
						},
						{
							type: 2,
							label: "Cancel Game",
							style: ButtonStyle.RED,
							custom_id: "cancel",
						},
					],
				},
			],
		};
	}
}

export const getPanelEmbedAndButtons = (): {
	embed: Embed;
	components: MessageComponentBase[];
} => {
	return {
		embed: new Embed({
			author: {
				name: "DisUNO",
			},
			title: "Start a game of Discord UNO",
			description: "To host a game press the `Create Game` button below!",
		}).setColor(
			["RED", "BLUE", "GREEN", "YELLOW"][Math.floor(Math.random() * 4)]
		),
		components: [
			{
				type: 1,
				components: [
					{
						type: 2,
						label: "Create Game",
						style: ButtonStyle.GREEN,
						custom_id: "creategame",
					},
				],
			},
		],
	};
};
