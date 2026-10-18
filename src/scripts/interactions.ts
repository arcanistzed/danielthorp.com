// Sounds for the interactions every page shares: pointing at a link or
// button, moving focus with the keyboard, jumping to a section, and opening
// a link somewhere else. An ancestor's data-sfx picks the flavour:
//   "paper" rustles, "flap" clacks like the status board, "terminal" clicks
//   like a keystroke, "wood" knocks on a drawer, "echo" lets link cues ring
//   out, "none" is silent.
// Components with their own sounds (the hero icons, the filters) set "none"
// or handle their clicks themselves. Anything else that should respond to
// the pointer, like a row of the status board, carries data-sfx-hover.

import {
	clack,
	isEnabled,
	key,
	knock,
	launch,
	rustle,
	setMuffled,
	tick,
	vibrate,
	whoosh,
} from "./sound";

const INTERACTIVE = "a[href], button, summary, [data-sfx-hover]";

function flavour(el: Element) {
	return el.closest<HTMLElement>("[data-sfx]")?.dataset.sfx ?? "tick";
}

function hover(el: Element, keyboard = false) {
	if (!isEnabled()) return;
	switch (flavour(el)) {
		case "none":
			// Silent for the pointer (the hero icons have their own magnet
			// sound), but keyboard focus still gets a cue.
			if (keyboard) tick();
			return;
		case "paper":
			return rustle();
		case "flap":
			return clack();
		case "terminal":
			return key();
		case "wood":
			return knock();
		default: {
			// Items in a list step up in pitch, so moving down it plays a scale.
			const item = el.closest("li");
			const siblings = item?.parentElement ? [...item.parentElement.children] : [];
			const index = item ? siblings.indexOf(item) : 0;
			return tick(Math.min(index, 7) * 2);
		}
	}
}

export function installInteractionSounds() {
	let last: Element | null = null;
	let lastAt = 0;

	document.addEventListener("pointerover", event => {
		if (event.pointerType !== "mouse") return;
		const el = (event.target as Element).closest(INTERACTIVE);
		if (!el) {
			last = null;
			return;
		}
		if (el === last) return;
		last = el;
		const now = performance.now();
		if (now - lastAt < 50) return;
		lastAt = now;
		hover(el);
	});

	document.addEventListener("pointerout", event => {
		const el = (event.target as Element).closest(INTERACTIVE);
		const to = event.relatedTarget as Node | null;
		if (el && el === last && !(to && el.contains(to))) last = null;
	});

	// Keyboard users hear the same thing when focus lands on a control.
	document.addEventListener("focusin", event => {
		const el = (event.target as Element).closest(INTERACTIVE);
		if (el?.matches(":focus-visible")) hover(el, true);
	});

	// The phone menu's overlay: the music goes backstage while it is open,
	// and opening and closing each get a light tap under their click. A close
	// caused by tapping a link gets none, since the glide taps on arrival.
	let lastLinkClick = 0;
	window.addEventListener("menu-open", () => {
		setMuffled(true);
		vibrate(8);
	});
	window.addEventListener("menu-close", () => {
		setMuffled(false);
		if (performance.now() - lastLinkClick > 150) vibrate(8);
	});

	document.addEventListener("click", event => {
		if (!isEnabled()) return;
		const link = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
		if (!link) return;
		const href = link.getAttribute("href") ?? "";
		if (href.startsWith("#")) {
			lastLinkClick = performance.now();
			const target = href.length > 1 ? document.getElementById(href.slice(1)) : null;
			whoosh(target ? target.getBoundingClientRect().top > 0 : true);
		} else if (flavour(link) === "paper") {
			rustle(true);
		} else {
			launch(flavour(link) === "echo");
		}
	});
}
