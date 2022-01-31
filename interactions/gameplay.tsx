import { ButtonInteraction } from "interaction";
import {
	games,
	UnoGame,
	cardToString,
	cardToButtonId,
	removeDiscriminator,
} from "game";
import {
	MessageComponentInteraction,
	Embed,
	fragment,
	BotUI,
	ActionRow,
	Button,
} from "harmony";

export default class GameplayInteractions extends ButtonInteraction {
	priorty = 3;

	async execute(i: MessageComponentInteraction) {
		const game = games.get(i.guild!.id)!;
		switch (i.customID) {
			case "draw": {
				if (game.currentPlayer.id != i.user.id) {
					await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								...UnoGame.embedTemplate,
								title: "Unable to draw",
								description: "It is not your turn!",
							}).setColor("RED"),
						],
					});
				} else {
					if (game.drawAmount > 0) {
						await i.reply({
							ephemeral: true,
							embeds: [
								new Embed({
									...UnoGame.embedTemplate,
									title: "Drew cards",
									description: `You have drawn ${game.drawAmount} card${
										game.drawAmount == 1 ? "" : "s"
									}.`,
								}).setColor("GREEN"),
							],
						});
						game.lastAction = `${removeDiscriminator(
							game.currentPlayer.name
						)} drew ${game.drawAmount} card${game.drawAmount == 1 ? "" : "s"}.`;
						game.givePlayerCards(game.drawAmount);
						game.drawAmount = 0;
						game.nextTurn();
					} else {
						if (game.currentPlayer.candraw) {
							if (game.gameDeck.length < 1) {
								game.nextTurn();
								await i.reply({
									ephemeral: true,
									embeds: [
										new Embed({
											...UnoGame.embedTemplate,
											title: "Unable to draw",
											description:
												"The deck is empty so you have been skipped!",
										}).setColor("RED"),
									],
								});
							} else {
								let drawAmount = 0;
								const drawCard = async () => {
									drawAmount++;
									if (game.gameDeck.length < 1) {
										await i.reply({
											ephemeral: true,
											embeds: [
												new Embed({
													...UnoGame.embedTemplate,
													title: "Unable to draw",
													description:
														"The deck is empty so you have been skipped!",
												}).setColor("RED"),
											],
										});
									} else {
										const card = game.gameDeck.pop()!;
										game.currentPlayer.cards.push(card);
										if (!game.isPlayableCard(card)) {
											drawCard();
										} else {
											game.currentPlayer.candraw = false;
											game.showGameEmbed(false);
											await i.reply({
												ephemeral: true,
												embeds: [
													new Embed({
														...UnoGame.embedTemplate,
														title: "Cards drawn",
														description: `You have drawn ${drawAmount} card and received a ${cardToString(
															card
														)}!`,
													}).setColor("GREEN"),
												],
												components: (
													<>
														<ActionRow>
															<Button
																style="green"
																label="Play"
																id={cardToButtonId(card)}
															/>
															<Button style="grey" label="Keep" id="keep" />
														</ActionRow>
													</>
												),
											});
										}
									}
								};

								drawCard();
							}
						} else {
							await i.reply({
								ephemeral: true,
								embeds: [
									new Embed({
										...UnoGame.embedTemplate,
										title: "Unable to draw",
										description: "You have already drawn a card this turn!",
									}).setColor("RED"),
								],
							});
						}
					}
				}
				return false;
			}

			case "keep": {
				if (game.currentPlayer.id != i.user.id) {
					await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								...UnoGame.embedTemplate,
								title: "Unable to keep",
								description: "It is not your turn!",
							}).setColor("RED"),
						],
					});
				} else {
					if (game.currentPlayer.candraw) {
						await i.reply({
							ephemeral: true,
							embeds: [
								new Embed({
									...UnoGame.embedTemplate,
									title: "Unable to keep",
									description: "You have not drawn a card!",
								}).setColor("RED"),
							],
						});
					} else {
						game.currentPlayer.candraw = true;
						game.lastAction = `${removeDiscriminator(
							i.user.username
						)} has kept their card`;
						game.nextTurn();
						await i.reply({
							ephemeral: true,
							embeds: [
								new Embed({
									...UnoGame.embedTemplate,
									title: "Card kept",
									description: "You have kept your card!",
								}).setColor("GREEN"),
							],
						});
					}
				}
				return false;
			}

			case "callout": {
				if (
					game.players.filter(
						({ cards, calledUno }) => cards.length < 2 && !calledUno
					).length > 0
				) {
					let savedSelf = false;
					let calledOutAmount = 0;
					for (const player of game.players.filter(
						({ cards, calledUno }) => cards.length < 2 && !calledUno
					)) {
						if (player.id == i.user.id) {
							player.calledUno = true;
							savedSelf = true;
						} else {
							calledOutAmount++;
							game.givePlayerCards(2, player);
						}
					}

					if (calledOutAmount > 0) {
						game.lastAction = `${removeDiscriminator(
							i.user.tag
						)} called out ${calledOutAmount} player${
							calledOutAmount > 1 ? "s" : ""
						} for not saying UNO!`;
					} else {
						game.lastAction = `${removeDiscriminator(i.user.tag)} called UNO!`;
					}

					await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								...UnoGame.embedTemplate,
								title: "Callout!",
								description: [
									calledOutAmount > 1
										? `You have called out ${calledOutAmount} player${
												calledOutAmount !== 1 ? "s" : ""
										  } for not saying UNO!`
										: "",
									savedSelf
										? `You have${
												calledOutAmount > 0 ? " also" : ""
										  } called UNO!`
										: "",
								].join(""),
							}).setColor("GREEN"),
						],
					});
					game.showGameEmbed(false);
				} else {
					await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								...UnoGame.embedTemplate,
								title: "Callout failed!",
								description:
									"Nobody currently has 1 card left that hasn't called uno!",
							}).setColor("RED"),
						],
					});
				}
				return false;
			}
		}
	}
}
