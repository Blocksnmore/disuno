import {
	Embed,
	Extension,
	slash,
	event,
	ApplicationCommandsModule,
	ApplicationCommandInteraction,
	Interaction,
	isMessageComponentInteraction,
	InteractionResponseType,
	MessageComponentPayload,
	ButtonStyle,
} from "harmony";
import { UnoGame, getPanelEmbedAndButtons } from "uno";
import { decks, DeckType } from "deck";
import { CardColor, CardType } from "cards";

/**
 * First argument is the guild id
 */
const games: Map<string, UnoGame> = new Map();

export default class Events extends Extension {
	name = "UnoEvents";

	@event()
	async ready() {
		const module = new Commands();
		module.commands = module.commands.map((cmd) => {
			this.client.interactions.handle({
				handler: cmd.handler,
				name: cmd.name,
			});
			return cmd;
		});
		if ((await this.client.interactions.commands.all()).array().length != 4) {
			this.client.interactions.commands.bulkEdit([
				{
					name: "createpanel",
					description: "Create a panel for Discord UNO!",
				},
				{
					name: "deckinfo",
					description: "Get information about a deck.",
					options: [
						{
							name: "deck",
							type: "STRING",
							description: "Get information about said deck.",
							required: true,
							choices: decks.map((d) => ({ name: d.name, value: d.id })),
						},
					],
				},
				{
					name: "help",
					description: "Get info regarding this bot",
				},
				{
					name: "stop",
					description: "Stop a game",
				},
			]);
		}
	}

	@event()
	async interactionCreate(_ext: this, i: Interaction) {
		if (!isMessageComponentInteraction(i)) return;
		if (i.guild == undefined || i.channel == undefined) return;
		if (i.message.author.id != this.client.user!.id) return;

		if (games.has(i.guild.id)) {
			const game = games.get(i.guild.id);
			if (game!.started && game!.getPlayer(i.user.id) == undefined) {
				return await i.reply({
					ephemeral: true,
					embeds: [
						new Embed({
							title: "You are not in the game!",
							description: "Please wait for the current game to end to join.",
						}).setColor("RED"),
					],
				});
			}
		}

		switch (i.customID.toLowerCase()) {
			// Creation
			case "creategame": {
				if (games.has(i.guild.id)) {
					return await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								title: "A game is already in progress!",
								description:
									"Please wait for the current game to end before starting a new one.",
							}).setColor("RED"),
						],
					});
				} else {
					await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								title: "Creating a game...",
								description:
									"Please select your deck from below. Use `/deckinfo <deck>` to learn more about a deck.",
								footer: {
									text: "This prompt will expire in 30 seconds!",
								},
							}).setColor("GREEN"),
						],
						components: [
							{
								type: 1,
								components: [
									{
										type: 2,
										label: "Classic",
										style: "BLURPLE",
										customID: "cg-classic",
									},
								],
							},
						],
					});

					const [res] = await i.client.waitFor(
						"interactionCreate",
						(e) =>
							isMessageComponentInteraction(e) &&
							e.customID.startsWith("cg-") &&
							e.user.id == i.user.id,
						30 * 1000
					);

					if (res == undefined) {
						return i.editResponse({
							embeds: [
								new Embed({
									title: "Game creation canceled!",
									description: "Creation has been canceled due to inactivity.",
								}).setColor("RED"),
							],
							components: [],
						});
					} else {
						if (!isMessageComponentInteraction(res)) return;
						const deck = DeckType.Classic; // Will be fetched soon:tm:
						if (games.has(i.guild.id)) {
							try {
								return await res.message.edit({
									embeds: [
										new Embed({
											title: "Unable to create game!",
											description:
												"This server already has a game in progress. Please wait for it to end.",
										}).setColor("RED"),
									],
								});
							} catch {
								return;
							}
						} else {
							games.set(
								i.guild.id,
								new UnoGame(
									{
										name: i.user.username,
										id: i.user.id,
										user: i.user,
									},
									i.client,
									deck
								)
							);

							const game = games.get(i.guild.id)!;

							const { embed, components } = game.getLobbyEmbedAndButton();

							game.message = await i.message.edit({
								components,
								embed,
							});

							return i.editResponse({
								embeds: [
									new Embed({
										title: "Game created!",
										description: "The game has been created!",
									}).setColor("GREEN"),
								],
								components: [],
							});
						}
					}
				}
			}

			case "join": {
				if (games.has(i.guild.id)) {
					const game = games.get(i.guild.id)!;
					for (const player of game.players) {
						if (player.id == i.user.id) {
							return await i.reply({
								ephemeral: true,
								embeds: [
									new Embed({
										title: "Unable to join game!",
										description: "You are already in the game!",
									}).setColor("RED"),
								],
							});
						}
						continue;
					}

					game.addPlayer(i.user.id, i.user.username);
					const { embed, components } = game.getLobbyEmbedAndButton();

					game.message!.edit({
						embeds: [embed],
						components,
					});

					return i.reply({
						ephemeral: true,
						content: "You have joined the game!",
					});
				} else {
					return await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								title: "Unable to join game!",
								description: "There is no game in progress on this server.",
							}).setColor("RED"),
						],
					});
				}
			}

			case "start": {
				if (games.has(i.guild.id)) {
					const game = games.get(i.guild.id)!;
					if (game.creator.id != i.user.id) {
						return await i.reply({
							ephemeral: true,
							embeds: [
								new Embed({
									title: "Unable to start game!",
									description: "You are not the game creator!",
								}).setColor("RED"),
							],
						});
					} else {
						if (game.players.length < 3 && i.user.id != "314166178144583682") {
							return await i.reply({
								ephemeral: true,
								embeds: [
									new Embed({
										title: "Unable to start game!",
										description: `You need 3 people to play! ${
											3 - game.players.length
										} more needed.`,
									}).setColor("RED"),
								],
							});
						} else {
							await i.respond({
								type: InteractionResponseType.DEFERRED_MESSAGE_UPDATE,
							});

							await game.message!.edit({
								embeds: [
									new Embed({
										title: "Starting game!",
										description: "Shuffling the deck...",
									}).setColor("GREEN"),
								],
								components: [],
							});

							setTimeout(
								() => game.onGameStart(),
								Math.floor(Math.random() * 1000) + 1000
							);
						}
					}
				} else {
					return await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								title: "Unable to start game!",
								description: "There is no game in progress on this server.",
							}).setColor("RED"),
						],
					});
				}
				return;
			}

			case "cancel": {
				if (games.has(i.guild.id)) {
					const game = games.get(i.guild.id)!;
					if (
						game.creator.id != i.user.id &&
						!i.member?.permissions.has("ADMINISTRATOR")
					) {
						return await i.reply({
							ephemeral: true,
							embeds: [
								new Embed({
									title: "Unable to cancel game!",
									description:
										"You are not the game creator nor an Administrator!",
								}).setColor("RED"),
							],
						});
					} else {
						await i.reply({
							ephemeral: true,
							embeds: [
								new Embed({
									title: "Cancelling!",
									description: "Cancelling game!",
								}).setColor("GREEN"),
							],
						});

						const { embed, components } = getPanelEmbedAndButtons();

						game.message!.edit({
							embeds: [
								embed.setFooter(
									`Previous game has been canceled by ${
										game.creator.id == i.user.id
											? "the Host"
											: "an Administrator"
									}!`
								),
							],
							components,
						});

						games.delete(i.guild.id);
					}
				} else {
					return await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								title: "Unable to cancel game!",
								description: "There is no game on this server.",
							}).setColor("RED"),
						],
					});
				}
				return;
			}
		}

		// Gameplay
		const game = games.get(i.guild.id);
		if (game == undefined || game.started == false) return;

		if (!game.getPlayerIDArray().includes(i.user.id)) {
			return await i.reply({
				ephemeral: true,
				embeds: [
					new Embed({
						title: "Unable to play!",
						description: "You are not in this game!",
					}).setColor("RED"),
				],
			});
		}

		switch (i.customID.toLowerCase()) {
			case "view": {
				game.showPlayerCards(i);
				break;
			}
			case "draw": {
				if (game.getCurrentPlayer().id != i.user.id) {
					return await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								title: "Unable to draw!",
								description: "It is not your turn!",
							}).setColor("RED"),
						],
					});
				} else {
					let drawn = 0;
					const giveCard = async () => {
						drawn++;
						game.givePlayerCards(1);
						if (
							!game.canCardBePlayed(
								game.getCurrentPlayer().cards[
									game.getCurrentPlayer().cards.length - 1
								]
							)
						) {
							giveCard();
						} else {
							game.showGameEmbed(false);
							await i.reply({
								ephemeral: true,
								embeds: [
									new Embed({
										title: "Cards drawn!",
										description: `You have drawn ${drawn} card${
											drawn > 1 ? "s" : ""
										} and got a \`${game.cardToString(
											game.getCurrentPlayer().cards[
												game.getCurrentPlayer().cards.length - 1
											]
										)}\`\nCards in hand: ${
											game.getCurrentPlayer().cards.length
										}`,
										footer: {
											text: "Card will be automatically played in 15 seconds if you don't respond",
										},
									}).setColor("GREEN"),
								],
								components: [
									{
										type: 1,
										components: [
											{
												type: 2,
												label: "Play",
												custom_id: "play",
												style: ButtonStyle.GREEN,
											},
											{
												type: 2,
												label: "Keep",
												custom_id: "keep",
												style: ButtonStyle.GREY,
											},
										],
									},
								] as MessageComponentPayload[],
							});

							const [res] = await i.client.waitFor(
								"interactionCreate",
								(i) =>
									isMessageComponentInteraction(i) &&
									i.user.id == game.getCurrentPlayer().id &&
									["keep", "play"].includes(i.customID),
								15 * 1000
							);

							if (
								res == undefined ||
								(isMessageComponentInteraction(res) && res.customID == "play")
							) {
								let { color, type } =
									game.getCurrentPlayer().cards[
										game.getCurrentPlayer().cards.length - 1
									];
								if (color == CardColor.WILD) {
									if (res == undefined) {
										color = [
											CardColor.BLUE,
											CardColor.GREEN,
											CardColor.RED,
											CardColor.YELLOW,
										][Math.floor(Math.random() * 4)];
									} else {
										try {
											await res.respond({
												flags: InteractionResponseType.DEFERRED_MESSAGE_UPDATE,
											});
										} catch {
											// Do noting
										}
										await i.editResponse({
											embeds: [
												new Embed({
													title: "Choose a color!",
													description: "Please select your wild color!",
													footer: {
														text: "Random color will be selected if you don't respond within 15 seconds",
													},
												}).setColor("LIGHT_GREY"),
											],
											components: [
												{
													type: 1,
													components: [
														{
															type: 2,
															label: "Blue",
															custom_id: "blue",
															style: ButtonStyle.BLURPLE,
														},
														{
															type: 2,
															label: "Red",
															custom_id: "red",
															style: ButtonStyle.RED,
														},
														{
															type: 2,
															label: "Green",
															custom_id: "green",
															style: ButtonStyle.GREEN,
														},
														{
															type: 2,
															label: "Yellow",
															custom_id: "yellow",
															style: ButtonStyle.GREY,
														},
													],
												},
											] as MessageComponentPayload[],
										});

										const [selectedColor] = await i.client.waitFor(
											"interactionCreate",
											(e) =>
												isMessageComponentInteraction(e) &&
												["blue", "red", "yellow", "green"].includes(
													e.customID
												) &&
												e.user.id == game.getCurrentPlayer().id,
											15 * 1000
										);

										if (selectedColor == undefined) {
											color = [
												CardColor.BLUE,
												CardColor.GREEN,
												CardColor.RED,
												CardColor.YELLOW,
											][Math.floor(Math.random() * 4)];
										} else {
											if (!isMessageComponentInteraction(selectedColor))
												throw new Error("Invalid response somehow");
											const selected = selectedColor.customID;
											for (const c of [
												CardColor.BLUE,
												CardColor.GREEN,
												CardColor.RED,
												CardColor.YELLOW,
											]) {
												if (
													selected.toLowerCase() == c.toString().toLowerCase()
												)
													color = c;
											}
										}
									}
								}

								game.playCard(color, type);
								await i.editResponse({
									embeds: [
										new Embed({
											title: "Card played!",
											description: "You have played your card!",
										}).setColor("GREEN"),
									],
									components: [],
								});
							} else {
								game.nextTurn();
								game.showGameEmbed();
								await i.editResponse({
									embeds: [
										new Embed({
											title: "Card held!",
											description: "You have kept your card",
										}).setColor("GREEN"),
									],
									components: [],
								});
							}
						}
					};
					giveCard();
				}
				break;
			}
		}

		const viewCardColor = async (color: CardColor) => {
			let ui: {
				buttonColor: ButtonStyle;
				colorText: string;
				buttonKey: string;
			};

			switch (color) {
				case CardColor.RED: {
					ui = {
						buttonColor: ButtonStyle.RED,
						colorText: "Red",
						buttonKey: "r",
					};
					break;
				}

				case CardColor.BLUE: {
					ui = {
						buttonColor: ButtonStyle.BLURPLE,
						colorText: "Blue",
						buttonKey: "b",
					};
					break;
				}

				case CardColor.GREEN: {
					ui = {
						buttonColor: ButtonStyle.GREEN,
						colorText: "Green",
						buttonKey: "g",
					};
					break;
				}

				case CardColor.YELLOW: {
					ui = {
						buttonColor: ButtonStyle.GREY,
						colorText: "Yellow",
						buttonKey: "y",
					};
					break;
				}

				case CardColor.WILD: {
					ui = {
						buttonColor: ButtonStyle.GREY,
						colorText: "Wild",
						buttonKey: "w",
					};
					break;
				}
			}

			const cards = game
				.getPlayer(i.user.id)!
				.cards.filter((c) => c.color == color);

			if (cards.length == 0) {
				return await i.reply({
					ephemeral: true,
					embeds: [
						new Embed({
							title: "No cards!",
							description: "You have no cards for this color!",
						}).setColor("RED"),
					],
					components: [],
				});
			} else {
				const isCurrentPlayer = game.getCurrentPlayer().id == i.user.id;
				const buttonRows: MessageComponentPayload[][] = [[]];
				const cardCounts: { [key: string]: number } = {};
				let index = 0;

				for (const card of cards) {
					cardCounts[card.type] = (cardCounts[card.type] ?? 0) + 1;
				}

				for (const cardType in cardCounts) {
					const cardCount = cardCounts[cardType];

					if (buttonRows[index].length > 4) {
						// No way there's going to be 5 rows
						index++;
						buttonRows[index] = [];
					}

					buttonRows[index].push({
						type: 2,
						label: `${game.formatCardString(cardType)}${
							cardCount > 1 ? ` x${cardCount}` : ""
						}`,
						custom_id: `${ui.buttonKey}-${cardType}`,
						style: ui.buttonColor,
						disabled: !(
							isCurrentPlayer &&
							game.canCardBePlayed(cards.find((c) => c.type == cardType)!)
						),
					});
				}

				if (game.getCurrentPlayer().cards.length == 2) {
					if (game.doesCurrentPlayerHavePlayableCard()) {
						buttonRows.push([
							{
								type: 2,
								label: "Call UNO!",
								custom_id: "uno",
								style: ButtonStyle.GREEN,
							},
						]);
					}
				}

				return await i.reply({
					ephemeral: true,
					embeds: [
						new Embed({
							title: `${ui.colorText} cards`,
							description: `Current card: \`${game.cardToString(
								game.lastCardPlayed!
							)}\`\n\nYou have the following cards:`,
						}).setColor(game.cardColorToEmbedColor(color)),
					],
					components: buttonRows.map((row) => ({
						type: 1,
						components: row,
					})),
				});
			}
		};

		if (i.customID == "call-uno") {
			const targetPlayer = game.players.filter(
				(p) => !p.calledUno && p.cards.length < 2
			)[0];
			if (targetPlayer == null) {
				return await i.reply({
					ephemeral: true,
					embeds: [
						new Embed({
							title: "Call UNO!",
							description:
								"Nobody needs to be called out currently! Somebody called it out already!",
						}).setColor("RED"),
					],
				});
			} else {
				if (targetPlayer.id == i.user.id) {
					targetPlayer.calledUno = true;
					game.showGameEmbed(false);
					return await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								title: "Call UNO!",
								description: "Good save, You have called uno!",
							}).setColor("GREEN"),
						],
					});
				} else {
					game.givePlayerCards(2, targetPlayer);
					game.showGameEmbed(false);
					return await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								title: "Call UNO!",
								description: "You have called the user out!",
							}).setColor("GREEN"),
						],
					});
				}
			}
		}

		if (i.customID == "uno") {
			if (game.getCurrentPlayer().id == i.user.id) {
				if (game.getCurrentPlayer().calledUno) {
					return await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								title: "Call UNO!",
								description: "You have already called UNO!",
							}).setColor("RED"),
						],
					});
				} else {
					game.getCurrentPlayer().calledUno = true;
					return await i.reply({
						ephemeral: true,
						embeds: [
							new Embed({
								title: "Call UNO!",
								description: "You have called UNO!",
							}).setColor("GREEN"),
						],
					});
				}
			} else {
				return await i.reply({
					ephemeral: true,
					embeds: [
						new Embed({
							title: "Call UNO!",
							description: "It's not your turn!",
						}).setColor("RED"),
					],
				});
			}
		}

		// Viewing cards
		switch (i.customID) {
			case CardColor.RED: {
				viewCardColor(CardColor.RED);
				break;
			}

			case CardColor.BLUE: {
				viewCardColor(CardColor.BLUE);
				break;
			}

			case CardColor.GREEN: {
				viewCardColor(CardColor.GREEN);
				break;
			}

			case CardColor.YELLOW: {
				viewCardColor(CardColor.YELLOW);
				break;
			}

			case CardColor.WILD: {
				viewCardColor(CardColor.WILD);
				break;
			}
		}

		if (game.getCurrentPlayer().id != i.user.id) {
			try {
				return await i.reply({
					ephemeral: true,
					embeds: [
						new Embed({
							title: "Not your turn!",
							description: "It's not your turn!",
						}).setColor("RED"),
					],
				});
			} catch {
				return;
			}
		}

		// Playing cards
		if (!i.customID.includes("-")) return;
		if (i.customID.toLowerCase().startsWith("w-")) {
			if (
				!game.doesCurrentPlayerHaveCard({
					color: CardColor.WILD,
					type:
						i.customID.toLowerCase() == "w-wild"
							? CardType.WILD
							: CardType.WILD_DRAW_FOUR,
				})
			) {
				return await i.reply({
					ephemeral: true,
					embeds: [
						new Embed({
							title: "Unable to play!",
							description: "You do not have this card!",
						}).setColor("RED"),
					],
				});
			}
			await i.reply({
				ephemeral: true,
				embeds: [
					new Embed({
						title: "Choose a color!",
						description: "Please select your wild color!",
						footer: {
							text: "Random color will be selected if you don't respond within 15 seconds",
						},
					}).setColor("LIGHT_GREY"),
				],
				components: [
					{
						type: 1,
						components: [
							{
								type: 2,
								label: "Blue",
								custom_id: "blue",
								style: ButtonStyle.BLURPLE,
							},
							{
								type: 2,
								label: "Red",
								custom_id: "red",
								style: ButtonStyle.RED,
							},
							{
								type: 2,
								label: "Green",
								custom_id: "green",
								style: ButtonStyle.GREEN,
							},
							{
								type: 2,
								label: "Yellow",
								custom_id: "yellow",
								style: ButtonStyle.GREY,
							},
						],
					},
				] as MessageComponentPayload[],
			});

			const [res] = await i.client.waitFor(
				"interactionCreate",
				(e) =>
					isMessageComponentInteraction(e) &&
					["blue", "red", "yellow", "green"].includes(e.customID) &&
					e.user.id == i.user.id &&
					game.getCurrentPlayer().id == e.user.id,
				15000
			);

			let color = [
				CardColor.BLUE,
				CardColor.GREEN,
				CardColor.RED,
				CardColor.YELLOW,
			][Math.floor(Math.random() * 4)];

			if (res != undefined && isMessageComponentInteraction(res)) {
				for (const c of [
					CardColor.BLUE,
					CardColor.GREEN,
					CardColor.RED,
					CardColor.YELLOW,
				]) {
					if (res.customID.toLowerCase() == c.toString().toLowerCase())
						color = c;
				}
			}

			if (game.getCurrentPlayer().id != i.user.id) {
				if (res != undefined) {
					i.editResponse({
						embeds: [
							new Embed({
								title: "Unable to play!",
								description: "It's not your turn!",
							}).setColor("RED"),
						],
						components: [],
					});
				}
			} else {
				if (res != undefined) {
					i.editResponse({
						embeds: [
							new Embed({
								title: "Card played!",
								description: "You have selected your wild and played it",
							}).setColor("LIGHT_GREY"),
						],
						components: [],
					});
				}
				game.playCard(
					color,
					i.customID.toLowerCase() == "w-wild"
						? CardType.WILD
						: CardType.WILD_DRAW_FOUR
				);
			}
		} else {
			const card = game.stringToCard(i.customID);
			console.log(card, "by retard", i.user.username);
			if (
				!game.canCardBePlayed(card) ||
				!game.doesCurrentPlayerHaveCard(card)
			) {
				return await i.reply({
					ephemeral: true,
					embeds: [
						new Embed({
							title: "Unplayable card!",
							description: "You can't play this card!",
						}).setColor("RED"),
					],
				});
			} else {
				if (game.getCurrentPlayer().cards.length == 1) {
					games.delete(i.guild.id);
				}
				game.playCard(card.color, card.type);
				return await i.reply({
					ephemeral: true,
					embeds: [
						new Embed({
							title: "Card played!",
							description: `You played \`${game.cardToString(card)}\``,
						}).setColor("GREEN"),
					],
				});
			}
		}
	}
}

class Commands extends ApplicationCommandsModule {
	name = "UnoCommands";

	@slash()
	async createpanel(i: ApplicationCommandInteraction) {
		if (i.member == undefined || i.channel == undefined) return;
		if (i.member.permissions.has("MANAGE_SERVER")) {
			const { embed, components } = getPanelEmbedAndButtons();
			const { message } = await i.reply({
				embeds: [embed],
				components,
			});

			i.channel.pinMessage(message!.id);
		} else {
			i.reply({
				ephemeral: true,
				embeds: [
					new Embed({
						title: "Missing permission!",
						description:
							"You need the `MANAGE_SERVER` permission to create a game.",
					}).setColor("RED"),
				],
			});
		}
	}

	@slash()
	deckinfo(i: ApplicationCommandInteraction) {
		const selection = i.option("deck");
		if (selection == undefined) {
			i.reply({
				ephemeral: true,
				embeds: [
					new Embed({
						title: "Missing argument!",
						description: "You need to specify a deck to get information about.",
					}).setColor("RED"),
				],
			});
		} else {
			const deck = decks.find((d) => d.id == selection)!;
			i.reply({
				ephemeral: true,
				embeds: [
					new Embed({
						title: "Deck Information",
						fields: [
							{
								name: deck.name,
								value: deck.description,
							},
						],
						footer: {
							text: `Cards: ${
								deck.cards.amount < 0
									? "Unknown (Deck coming soon)"
									: deck.cards.amount
							}`,
						},
					}).setColor(
						["RED", "GREEN", "BLUE", "YELLOW"][Math.floor(Math.random() * 4)]
					),
				],
			});
		}
	}

	@slash()
	async help(i: ApplicationCommandInteraction) {
		await i.reply({
			ephemeral: true,
			embeds: [
				new Embed({
					title: "DisUno",
					description:
						"A crappy discord bot to play uno, developed by [Blocks_n_more#5526](https://twitter.com/blocksnmore). Source code: [Github](https://github.com/blocksnmore/disuno)",
				}).setColor("RED"),
			],
		});
	}

	@slash()
	async stop(i: ApplicationCommandInteraction) {
		if (i.member == undefined || i.channel == undefined) return;
		if (i.member.permissions.has("MANAGE_SERVER")) {
			if (games.has(i.guild!.id)) {
				const game = games.get(i.guild!.id)!;
				const { embed, components } = getPanelEmbedAndButtons();
				try {
					game.message!.edit({
						embeds: [
							embed.setFooter(
								"Previous game has been canceled by an Administrator!"
							),
						],
						components,
					});
				} catch {
					//Do nothing
				}

				games.delete(i.guild!.id);
				await i.reply({
					ephemeral: true,
					embeds: [
						new Embed({
							title: "Game canceled!",
							description: "The game has been canceled.",
						}).setColor("GREEN"),
					],
				});
			} else {
				await i.reply({
					ephemeral: true,
					embeds: [
						new Embed({
							title: "No game running!",
							description: "There is no game currently running in this server.",
						}).setColor("RED"),
					],
				});
			}
		} else {
			await i.reply({
				ephemeral: true,
				embeds: [
					new Embed({
						title: "Missing permission!",
						description:
							"You need the `MANAGE_SERVER` permission to create a game.",
					}).setColor("RED"),
				],
			});
		}
	}
}
