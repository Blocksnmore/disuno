import { DeckCard, CardColor, CardType } from "cards";

const deck: DeckCard[] = [
	// Plus 4s
	{
		color: CardColor.WILD,
		type: CardType.WILD_DRAW_FOUR,
	},
	{
		color: CardColor.WILD,
		type: CardType.WILD_DRAW_FOUR,
	},
	{
		color: CardColor.WILD,
		type: CardType.WILD_DRAW_FOUR,
	},
	{
		color: CardColor.WILD,
		type: CardType.WILD_DRAW_FOUR,
	},

	// Wilds
	{
		color: CardColor.WILD,
		type: CardType.WILD,
	},
	{
		color: CardColor.WILD,
		type: CardType.WILD,
	},
	{
		color: CardColor.WILD,
		type: CardType.WILD,
	},
	{
		color: CardColor.WILD,
		type: CardType.WILD,
	},
	{
		color: CardColor.WILD,
		type: CardType.WILD,
	},
	{
		color: CardColor.WILD,
		type: CardType.WILD,
	},
	{
		color: CardColor.WILD,
		type: CardType.WILD,
	},
	{
		color: CardColor.WILD,
		type: CardType.WILD,
	},

	// Plus 2s
	{
		color: CardColor.BLUE,
		type: CardType.DRAW_TWO,
	},
	{
		color: CardColor.BLUE,
		type: CardType.DRAW_TWO,
	},
	{
		color: CardColor.RED,
		type: CardType.DRAW_TWO,
	},
	{
		color: CardColor.RED,
		type: CardType.DRAW_TWO,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.DRAW_TWO,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.DRAW_TWO,
	},
	{
		color: CardColor.GREEN,
		type: CardType.DRAW_TWO,
	},
	{
		color: CardColor.GREEN,
		type: CardType.DRAW_TWO,
	},

	// Skips
	{
		color: CardColor.BLUE,
		type: CardType.SKIP,
	},
	{
		color: CardColor.BLUE,
		type: CardType.SKIP,
	},
	{
		color: CardColor.RED,
		type: CardType.SKIP,
	},
	{
		color: CardColor.RED,
		type: CardType.SKIP,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.SKIP,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.SKIP,
	},
	{
		color: CardColor.GREEN,
		type: CardType.SKIP,
	},
	{
		color: CardColor.GREEN,
		type: CardType.SKIP,
	},

	// Reverse
	{
		color: CardColor.BLUE,
		type: CardType.REVERSE,
	},
	{
		color: CardColor.BLUE,
		type: CardType.REVERSE,
	},
	{
		color: CardColor.RED,
		type: CardType.REVERSE,
	},
	{
		color: CardColor.RED,
		type: CardType.REVERSE,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.REVERSE,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.REVERSE,
	},
	{
		color: CardColor.GREEN,
		type: CardType.REVERSE,
	},
	{
		color: CardColor.GREEN,
		type: CardType.REVERSE,
	},

	// 0s
	{
		color: CardColor.BLUE,
		type: CardType.ZERO,
	},
	{
		color: CardColor.RED,
		type: CardType.ZERO,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.ZERO,
	},
	{
		color: CardColor.GREEN,
		type: CardType.ZERO,
	},

	// 1s
	{
		color: CardColor.BLUE,
		type: CardType.ONE,
	},
	{
		color: CardColor.BLUE,
		type: CardType.ONE,
	},
	{
		color: CardColor.RED,
		type: CardType.ONE,
	},
	{
		color: CardColor.RED,
		type: CardType.ONE,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.ONE,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.ONE,
	},
	{
		color: CardColor.GREEN,
		type: CardType.ONE,
	},
	{
		color: CardColor.GREEN,
		type: CardType.ONE,
	},

	// 2s
	{
		color: CardColor.BLUE,
		type: CardType.TWO,
	},
	{
		color: CardColor.BLUE,
		type: CardType.TWO,
	},
	{
		color: CardColor.RED,
		type: CardType.TWO,
	},
	{
		color: CardColor.RED,
		type: CardType.TWO,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.TWO,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.TWO,
	},
	{
		color: CardColor.GREEN,
		type: CardType.TWO,
	},
	{
		color: CardColor.GREEN,
		type: CardType.TWO,
	},

	// 3s
	{
		color: CardColor.BLUE,
		type: CardType.THREE,
	},
	{
		color: CardColor.BLUE,
		type: CardType.THREE,
	},
	{
		color: CardColor.RED,
		type: CardType.THREE,
	},
	{
		color: CardColor.RED,
		type: CardType.THREE,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.THREE,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.THREE,
	},
	{
		color: CardColor.GREEN,
		type: CardType.THREE,
	},
	{
		color: CardColor.GREEN,
		type: CardType.THREE,
	},

	// 4s
	{
		color: CardColor.BLUE,
		type: CardType.FOUR,
	},
	{
		color: CardColor.BLUE,
		type: CardType.FOUR,
	},
	{
		color: CardColor.RED,
		type: CardType.FOUR,
	},
	{
		color: CardColor.RED,
		type: CardType.FOUR,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.FOUR,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.FOUR,
	},
	{
		color: CardColor.GREEN,
		type: CardType.FOUR,
	},
	{
		color: CardColor.GREEN,
		type: CardType.FOUR,
	},

	// 5s
	{
		color: CardColor.BLUE,
		type: CardType.FIVE,
	},
	{
		color: CardColor.BLUE,
		type: CardType.FIVE,
	},
	{
		color: CardColor.RED,
		type: CardType.FIVE,
	},
	{
		color: CardColor.RED,
		type: CardType.FIVE,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.FIVE,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.FIVE,
	},
	{
		color: CardColor.GREEN,
		type: CardType.FIVE,
	},
	{
		color: CardColor.GREEN,
		type: CardType.FIVE,
	},

	// 6s
	{
		color: CardColor.BLUE,
		type: CardType.SIX,
	},
	{
		color: CardColor.BLUE,
		type: CardType.SIX,
	},
	{
		color: CardColor.RED,
		type: CardType.SIX,
	},
	{
		color: CardColor.RED,
		type: CardType.SIX,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.SIX,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.SIX,
	},
	{
		color: CardColor.GREEN,
		type: CardType.SIX,
	},
	{
		color: CardColor.GREEN,
		type: CardType.SIX,
	},

	// 7s
	{
		color: CardColor.BLUE,
		type: CardType.SEVEN,
	},
	{
		color: CardColor.BLUE,
		type: CardType.SEVEN,
	},
	{
		color: CardColor.RED,
		type: CardType.SEVEN,
	},
	{
		color: CardColor.RED,
		type: CardType.SEVEN,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.SEVEN,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.SEVEN,
	},
	{
		color: CardColor.GREEN,
		type: CardType.SEVEN,
	},
	{
		color: CardColor.GREEN,
		type: CardType.SEVEN,
	},

	// 8s
	{
		color: CardColor.BLUE,
		type: CardType.EIGHT,
	},
	{
		color: CardColor.BLUE,
		type: CardType.EIGHT,
	},
	{
		color: CardColor.RED,
		type: CardType.EIGHT,
	},
	{
		color: CardColor.RED,
		type: CardType.EIGHT,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.EIGHT,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.EIGHT,
	},
	{
		color: CardColor.GREEN,
		type: CardType.EIGHT,
	},
	{
		color: CardColor.GREEN,
		type: CardType.EIGHT,
	},

	// 9s
	{
		color: CardColor.BLUE,
		type: CardType.NINE,
	},
	{
		color: CardColor.BLUE,
		type: CardType.NINE,
	},
	{
		color: CardColor.RED,
		type: CardType.NINE,
	},
	{
		color: CardColor.RED,
		type: CardType.NINE,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.NINE,
	},
	{
		color: CardColor.YELLOW,
		type: CardType.NINE,
	},
	{
		color: CardColor.GREEN,
		type: CardType.NINE,
	},
	{
		color: CardColor.GREEN,
		type: CardType.NINE,
	},
];

export default deck;
