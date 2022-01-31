import { CardColor, DeckCard, CardType } from "../cards.ts";
import { decks } from "../deck.ts";

export const getRandomUnoColor = () => {
	const colors = ["RED", "YELLOW", "BLUE", "GREEN"];
	return colors[Math.floor(Math.random() * colors.length)];
};

export const getRandomInteger = (min: number, max: number) => {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const shuffleArray = <T>(array: T[]): T[] => {
	for (const _entry of new Array(getRandomInteger(2, 5))) {
		const newArray: T[] = [];

		for (const entry of array) {
			if (getRandomInteger(1, 2) === 1) {
				newArray.push(entry);
			} else {
				newArray.unshift(entry);
			}
		}

		array = newArray;
	}

	return array;
};

export const cardColorToEmbedColor = (color: CardColor) => {
	if (color == CardColor.WILD) return "LIGHT_GREY";
	return color.toString().toUpperCase();
};

export const cardToString = ({ color, type }: DeckCard) => {
	return `${formatString(color)} ${formatString(type).replace(/_/g, " ")}`;
};

export const formatString = (msg: string) =>
	msg.substring(0, 1).toUpperCase() + msg.substring(1).toLowerCase();

export const removeDiscriminator = (user: string) => {
	let username = user.split("#")[0];

	if (username.length > 20) {
		username = username.substring(0, 20) + "...";
	}

	return username;
}

export const deckIdToDeck = (deckName: string) => {
	for (const deck of decks) {
		if (deck.id == deckName) return deck;
	}
	return null;
};

export const sleep = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));

export const cardToButtonId = ({ type, color }: DeckCard) =>
	color.toLowerCase().substring(0, 1) +
	"-" +
	type.toLowerCase().replace(/_/g, "-");

export const cardIdToCard = (card: string) => {
	const color = card.substring(0, 1).toLowerCase();
	const type = card.substring(2).toLowerCase().replace(/-/g, "_");
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

	if (color == undefined || type == undefined) return null;

	return {
		color: cardColor,
		type: cardType,
	};
};
