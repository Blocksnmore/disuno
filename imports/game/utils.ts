import { CardColor, DeckCard } from "../cards.ts";
import { decks } from "../deck.ts";

export const getRandomUnoColor = () => {
	const colors = ["RED", "YELLOW", "BLUE", "GREEN"];
	return colors[Math.floor(Math.random() * colors.length)];
};

export const getRandomInteger = (min: number, max: number) => {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const shuffleArray = <T>(array: T[]): T[] => {
	const newArray: T[] = [];

	for (const entry of array) {
		if (getRandomInteger(1, 2) === 1) {
			newArray.push(entry);
		} else {
			newArray.unshift(entry);
		}
	}
	
	array = newArray;

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

export const removeDiscriminator = (user: string) =>
	user.substring(0, user.length - 5);

export const deckIdToDeck = (deckName: string) => {
	for (const deck of decks) {
		if (deck.id == deckName) return deck;
	}
	return null;
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const cardToButtonId = ({ type, color }: DeckCard) => color.toLowerCase().substring(1) + type.toLowerCase().replace(/_/g, "-");