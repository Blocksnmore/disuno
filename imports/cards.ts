export enum CardColor {
	RED = "RED",
	BLUE = "BLUE",
	GREEN = "GREEN",
	YELLOW = "YELLOW",
	WILD = "WILD",
}

export enum CardType {
	SKIP = "SKIP",
	REVERSE = "REVERSE",
	DRAW_TWO = "DRAW_TWO",
	WILD = "WILD",
	WILD_DRAW_FOUR = "WILD_DRAW_FOUR",
	ZERO = "ZERO",
	ONE = "ONE",
	TWO = "TWO",
	THREE = "THREE",
	FOUR = "FOUR",
	FIVE = "FIVE",
	SIX = "SIX",
	SEVEN = "SEVEN",
	EIGHT = "EIGHT",
	NINE = "NINE",
}

export interface DeckCard {
	color: CardColor;
	type: CardType;
}