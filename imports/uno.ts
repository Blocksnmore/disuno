import {
	Embed,
	MessageComponentBase,
	ButtonStyle,
	User,
	Message,
	Client,
	Interaction,
	MessageComponentPayload,
} from "harmony";
import { decks, DeckType } from "deck";
import { DeckCard, CardType, CardColor } from "cards";

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
	public startingCards = 20;
	/** For card stacking */
	public drawAmount = 0;
	/** If you can play a plus 2 on the stack */
	public canPlayPlusTwo = false;

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
			if (card.type == type && card.color == color && !cardRemoved) {
				cardRemoved = true;
			} else {
				cards.push(card);
			}
		}
		this.getCurrentPlayer().cards = cards;

		if (type == CardType.DRAW_TWO) {
			this.drawAmount += 2;
			this.canPlayPlusTwo = true;
		} else if (type == CardType.WILD_DRAW_FOUR) {
			this.drawAmount += 4;
			this.canPlayPlusTwo = false;
		}

		this.lastCardPlayed = {
			type,
			color
		}

		this.deck.push({
			type,
			color
		})

		// Prevent order stuff
		this.shuffleDeck();

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

	public canCardBePlayed(card: DeckCard) {
		if (
			card.color == CardColor.WILD ||
			card.color == this.lastCardPlayed!.color ||
			card.type == this.lastCardPlayed!.type
		) {
			return true;
		} else {
			return false;
		}
	}

	// Messages

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
				}).setColor(
					this.cardColorToEmbedColor(this.lastCardPlayed!.color)
				),
			],
			components: [
				{
					type: 1,
					components,
				},
			],
		});
	}

	public async showGameEmbed() {
		await this.message!.edit({
			embed: new Embed({
				author: {
					name: "Discord Uno",
				},
				description: `Current turn: <@!${this.getCurrentPlayer().id}>`,
				fields: [
					{
						name: "Current card",
						value: `\`${this.cardToString(this.lastCardPlayed!)}\``,
					},
					{
						name: "Cards:",
						value: this.players
							.map((p) => `\`${p.username}: ${p.cards.length}\``)
							.join("\n"),
					},
				],
				footer: {
					text: "Press the Play/Draw button to do an action! | Time limit: 30 seconds",
				},
			}).setColor(this.cardColorToEmbedColor(this.lastCardPlayed!.color)),
			components: [
				{
					type: 1,
					components: [
						{
							type: 2,
							label: "Play",
							style: ButtonStyle.GREEN,
							customID: "play",
						},
						{
							type: 2,
							label: "Draw",
							style: ButtonStyle.RED,
							customID: "draw",
							disabled: this.deck.length == 0
						},
						{
							type: 2,
							label: "View cards",
							style: ButtonStyle.GREY,
							customID: "view",
						},
					],
				},
			],
		});
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
