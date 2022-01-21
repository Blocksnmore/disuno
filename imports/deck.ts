import { DeckCard } from "./cards.ts";
import ClassicCards from "../cards/classic/deck.ts";

export interface DeckType {
	name: string;
	id: string;
	description: string;
	cards: {
		amount: number;
		cards: DeckCard[];
	};
}

export const decks: DeckType[] = [
	{
		name: "Classic",
		id: "classic",
		description: "Classic UNO deck.",
		cards: {
			amount: ClassicCards.length,
			cards: ClassicCards,
		},
	},
	{
		name: "Flip",
		id: "flip",
		description:
			"Uno but you can flip the cards over revealing different cards. Your opponents can see your inactive cards.",
		cards: {
			amount: -1,
			cards: [],
		},
	},
];

export enum Decks {
	Classic = "classic",
	Flip = "flip",
}
