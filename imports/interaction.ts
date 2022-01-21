import { MessageComponentInteraction } from "./harmony.ts";

export class ButtonInteraction {
	/** Lower = more important */
	priorty = 100;
	execute(_i: MessageComponentInteraction): Promise<boolean | void> | boolean | void {}
}