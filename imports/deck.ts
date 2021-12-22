import ClassicCards from "../cards/classic.ts";

export interface DeckInfo {
	name: string;
	id: string;
	description: string;
	cards: number;
}

export const decks: DeckInfo[] = [
	{
		name: "Classic",
		id: "classic",
		description: "Classic UNO deck.",
		cards: ClassicCards.length,
	},
	{
		name: "Flip",
		id: "flip",
		description:
			"Uno but you can flip the cards over revealing different cards. Your opponents can see your inactive cards.",
		cards: 112,
	},
];

export enum DeckType {
	Classic = "classic",
	Flip = "flip",
}