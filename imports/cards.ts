export enum CardColor {
	RED = "RED",
	BLUE = "BLUE",
	GREEN = "GREEN",
	YELLOW = "YELLOW",
	WILD = "WILD",

	PLACEHOLDER = "PLACEHOLDER",
}

export enum CardType {
	WILD = "WILD",
	WILD_DRAW_FOUR = "PLUS_4",

	DRAW_TWO = "PLUS_2",
	SKIP = "SKIP",
	REVERSE = "REVERSE",

	ZERO = "0",
	ONE = "1",
	TWO = "2",
	THREE = "3",
	FOUR = "4",
	FIVE = "5",
	SIX = "6",
	SEVEN = "7",
	EIGHT = "8",
	NINE = "9",

	PLACEHOLDER = "PLACEHOLDER",
}

export interface DeckCard {
	color: CardColor;
	type: CardType;
}