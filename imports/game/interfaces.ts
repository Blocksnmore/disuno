import { DeckCard } from "../cards.ts";

export interface UnoPlayer {
	id: string;
	name: string;
	cards: DeckCard[];
	calledUno: boolean;
	candraw: boolean;
}

export enum UnoGameState {
	LOBBY = "LOBBY",
	PLAYING = "PLAYING",
	END = "END",
}