// Sound and haptics for the home page. Everything is synthesized with the
// Web Audio API, so there are no audio files. Nothing plays until the visitor
// turns sound on, and browsers only allow that from a click, tap or key press.

const STORAGE_KEY = "sound";
const TIER_KEY = "sound-tier";

/** Tempo shared by the beds and the music box, in beats per minute. */
export const BPM = 76;

/**
 * How much of the experience this device gets. "full" is everything; "lite"
 * drops the convolution reverb and uses fewer oscillators per note; "none"
 * hides the sound controls, because a page that stutters is worse than a
 * quiet one. Decided from what the device reports, then stepped down while
 * playing if the audio thread can't keep up.
 */
export type Tier = "full" | "lite" | "none";

function detectTier(): Tier {
	const hasAudio =
		"AudioContext" in window ||
		"webkitAudioContext" in (window as unknown as Record<string, unknown>);
	if (!hasAudio) return "none";
	// A step-down from an earlier visit holds for a week.
	try {
		const saved = JSON.parse(localStorage.getItem(TIER_KEY) ?? "null") as {
			tier: Tier;
			until: number;
		} | null;
		if (saved && saved.until > Date.now() && (saved.tier === "lite" || saved.tier === "none")) {
			return saved.tier;
		}
	} catch {}
	const nav = navigator as Navigator & {
		deviceMemory?: number;
		connection?: { saveData?: boolean };
	};
	const cores = nav.hardwareConcurrency ?? 4;
	const memory = nav.deviceMemory ?? 4;
	if (cores <= 2 || memory <= 2 || nav.connection?.saveData) return "none";
	const phone = matchMedia("(pointer: coarse)").matches;
	if (cores <= 4 || memory <= 4 || phone) return "lite";
	return "full";
}

let tier: Tier = detectTier();
if (tier === "none") document.documentElement.classList.add("sound-none");

/** The current tier. */
export function soundTier() {
	return tier;
}

/** Whether this device gets sound at all. */
export function supported() {
	return tier !== "none";
}

function stepDown() {
	const next: Tier = tier === "full" ? "lite" : "none";
	tier = next;
	try {
		localStorage.setItem(
			TIER_KEY,
			JSON.stringify({ tier: next, until: Date.now() + 7 * 24 * 3600 * 1000 }),
		);
	} catch {}
	if (next === "none") {
		document.documentElement.classList.add("sound-none");
		if (enabled) setEnabled(false);
	} else {
		dropReverb();
	}
	window.dispatchEvent(new CustomEvent("sound-tier", { detail: next }));
}

// Watch the audio thread. Chromium reports underruns directly; elsewhere the
// context clock is compared with the wall clock, which only catches a stall.
// Three bad seconds in a row step the tier down.
let strikes = 0;
function report(underrun: number, load: number) {
	if (underrun > 0.02 || load > 0.9) strikes += 1;
	else strikes = Math.max(0, strikes - 1);
	if (strikes >= 3) {
		strikes = 0;
		stepDown();
	}
}

function monitor(context: AudioContext) {
	const capacity = (
		context as AudioContext & {
			renderCapacity?: EventTarget & { start(options?: { updateInterval: number }): void };
		}
	).renderCapacity;
	if (capacity) {
		capacity.addEventListener("update", event => {
			const { underrunRatio, averageLoad } = event as Event & {
				underrunRatio: number;
				averageLoad: number;
			};
			if (enabled && !document.hidden) report(underrunRatio, averageLoad);
		});
		capacity.start({ updateInterval: 1 });
		return;
	}
	let lastClock = context.currentTime;
	let lastWall = performance.now();
	window.setInterval(() => {
		const clock = context.currentTime - lastClock;
		const wall = (performance.now() - lastWall) / 1000;
		lastClock = context.currentTime;
		lastWall = performance.now();
		if (!enabled || document.hidden || context.state !== "running" || wall < 0.5) return;
		report(clock / wall < 0.9 ? 1 - clock / wall : 0, 0);
	}, 1000);
}

export type Pref = "on" | "off" | null;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let delaySend: GainNode | null = null;
let reverbSend: GainNode | null = null;
let reverb: { convolver: ConvolverNode; damp: BiquadFilterNode } | null = null;
// The space: the delay's feedback and return, and the reverb's return. A
// mute closes them so the page goes quiet; turning sound on reopens them.
let delayFeedbacks: GainNode[] = [];
let delayReturn: GainNode | null = null;
let reverbWet: GainNode | null = null;
let music: GainNode | null = null;
let musicFilter: BiquadFilterNode | null = null;
let enabled = false;

/** A sounding voice: its oscillators and the gain that shapes them. */
interface Voice {
	oscs: OscillatorNode[];
	amp: GainNode;
}
const voices = new Set<Voice>();

/** Register a voice so a brake can slow it down and fade it out. */
export function trackVoice(amp: GainNode, ...oscs: OscillatorNode[]) {
	const voice = { oscs, amp };
	voices.add(voice);
	let left = oscs.length;
	for (const osc of oscs) {
		osc.addEventListener("ended", () => {
			if (--left <= 0) voices.delete(voice);
		});
	}
}

/**
 * Everything sounding slows and fades like a record when the turntable is
 * switched off, with the brake's hiss under it. With `echo`, the slowing
 * notes repeat into the delay as they fall, a DJ's echo-out; a mute passes
 * false so the page can go quiet. Returns how long the brake takes.
 */
export function brake(seconds = 0.8, echo = true) {
	if (!ctx) return 0;
	const now = ctx.currentTime;
	for (const { oscs, amp } of voices) {
		for (const osc of oscs) {
			const detune = osc.detune.value;
			osc.detune.cancelScheduledValues(now);
			osc.detune.setValueAtTime(detune, now);
			osc.detune.linearRampToValueAtTime(detune - 4800, now + seconds);
			try {
				osc.stop(now + seconds + 0.05);
			} catch {}
		}
		amp.gain.cancelScheduledValues(now);
		amp.gain.setValueAtTime(Math.max(amp.gain.value, 0.0001), now);
		amp.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
		if (echo && delaySend) {
			const send = ctx.createGain();
			send.gain.value = 0.5;
			amp.connect(send);
			send.connect(delaySend);
		}
	}
	voices.clear();
	if (echo) {
		for (const { gain: feedback } of delayFeedbacks) {
			feedback.cancelScheduledValues(now);
			feedback.setValueAtTime(feedback.value, now);
			feedback.linearRampToValueAtTime(0.62, now + 0.2);
			feedback.setTargetAtTime(0.38, now + 2.4, 0.5);
		}
	}
	air(700, 90, seconds, 0.04, 0.08);
	// Two slowing thumps, like the platter catching as it stops.
	vibrate([14, 90, 8]);
	return seconds;
}

/** After a mute: let the brake be heard, then close the delay and the room. */
function closeSpace(after: number) {
	if (!ctx || !delayReturn || !reverbWet) return;
	const at = ctx.currentTime + after;
	const params = [delayReturn.gain, reverbWet.gain, ...delayFeedbacks.map(f => f.gain)];
	for (const param of params) {
		param.cancelScheduledValues(at);
		param.setValueAtTime(param.value, at);
		param.linearRampToValueAtTime(0, at + 0.5);
	}
}

function openSpace() {
	if (!ctx || !delayReturn || !reverbWet) return;
	const now = ctx.currentTime;
	const settings: [AudioParam, number][] = [
		[delayReturn.gain, 1],
		[reverbWet.gain, 0.9],
		...delayFeedbacks.map(f => [f.gain, 0.38] as [AudioParam, number]),
	];
	for (const [param, value] of settings) {
		param.cancelScheduledValues(now);
		param.setValueAtTime(value, now);
	}
}

export function getPref(): Pref {
	try {
		const value = localStorage.getItem(STORAGE_KEY);
		return value === "on" || value === "off" ? value : null;
	} catch {
		return null;
	}
}

function savePref(on: boolean) {
	try {
		localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
	} catch {}
}

export function isEnabled() {
	return enabled && ctx !== null;
}

/** The graph for longer-running music, or null while sound is off. */
export function audio() {
	if (!isEnabled() || !ctx || !master || !delaySend || !reverbSend || !music) return null;
	return { ctx, master, delaySend, reverbSend, music };
}

/** Call from a click, tap or key handler so the browser lets audio start. */
export function setEnabled(on: boolean) {
	if (on && tier === "none") return;
	// Turning off brakes whatever is playing, then the delay and the room
	// close so the page is quiet within about a second; the beds tear down
	// once it has stopped.
	if (!on && enabled) {
		const seconds = brake(0.8, false);
		closeSpace(seconds * 0.6);
	}
	enabled = on;
	savePref(on);
	if (on) {
		ensureContext();
		openSpace();
		void ctx?.resume();
	}
	window.dispatchEvent(new CustomEvent("sound-change", { detail: on }));
}

function ensureContext() {
	if (ctx) return;
	const AudioCtx =
		window.AudioContext ??
		(window as unknown as { webkitAudioContext?: typeof AudioContext })
			.webkitAudioContext;
	if (!AudioCtx) return;
	ctx = new AudioCtx();

	const compressor = ctx.createDynamicsCompressor();
	compressor.threshold.value = -18;
	compressor.ratio.value = 4;
	compressor.connect(ctx.destination);

	master = ctx.createGain();
	master.gain.value = 0.5;
	master.connect(compressor);

	// A dark ping-pong delay on a dotted eighth at the site's tempo: each
	// echo lands on the grid and crosses to the other side.
	const hop = (60 / BPM) * 0.75;
	const merger = ctx.createChannelMerger(2);
	const sides = [0, 1].map(side => {
		const delay = ctx!.createDelay(1);
		delay.delayTime.value = hop;
		const tone = ctx!.createBiquadFilter();
		tone.type = "lowpass";
		tone.frequency.value = 1800;
		const feedback = ctx!.createGain();
		feedback.gain.value = 0.38;
		delay.connect(tone);
		tone.connect(merger, 0, side);
		tone.connect(feedback);
		return { delay, feedback };
	});
	sides[0].feedback.connect(sides[1].delay);
	sides[1].feedback.connect(sides[0].delay);
	delayFeedbacks = sides.map(side => side.feedback);
	delaySend = ctx.createGain();
	delaySend.gain.value = 0.35;
	delaySend.connect(sides[0].delay);
	delayReturn = ctx.createGain();
	delayReturn.gain.value = 1;
	merger.connect(delayReturn);
	delayReturn.connect(master);

	// A room, from a generated impulse: two and a half seconds of noise that
	// dies away, darkened so the tail sits behind the music rather than on it.
	// The convolution is the costliest node here, so the lite tier goes
	// without it; the sends then lead nowhere.
	reverbSend = ctx.createGain();
	reverbSend.gain.value = 1;
	const wet = ctx.createGain();
	wet.gain.value = 0.9;
	reverbWet = wet;
	if (tier === "full") {
		const convolver = ctx.createConvolver();
		convolver.buffer = impulse(ctx, 2.5, 3.4);
		const damp = ctx.createBiquadFilter();
		damp.type = "lowpass";
		damp.frequency.value = 4200;
		reverbSend.connect(convolver);
		convolver.connect(damp);
		damp.connect(wet);
		wet.connect(master);
		reverb = { convolver, damp };
	}
	monitor(ctx);

	// The section beds go through one filter that closes a little while the
	// visitor scrolls quickly, like wind over the music.
	musicFilter = ctx.createBiquadFilter();
	musicFilter.type = "lowpass";
	musicFilter.frequency.value = ceiling();
	musicFilter.Q.value = 0.3;
	musicFilter.connect(master);
	music = ctx.createGain();
	music.gain.value = 0.8;
	music.connect(musicFilter);
}

/** Stepping down to lite while playing: fade the room out, then unplug it. */
function dropReverb() {
	if (!ctx || !reverb || !reverbWet || !reverbSend) return;
	const now = ctx.currentTime;
	const { convolver, damp } = reverb;
	reverb = null;
	reverbWet.gain.setTargetAtTime(0, now, 0.4);
	window.setTimeout(() => {
		try {
			reverbSend?.disconnect(convolver);
			convolver.disconnect();
			damp.disconnect();
		} catch {}
	}, 2500);
}

/** A stereo impulse response: decaying noise after a short pre-delay. */
function impulse(context: AudioContext, seconds: number, decay: number) {
	const rate = context.sampleRate;
	const length = Math.floor(rate * seconds);
	const preDelay = Math.floor(rate * 0.018);
	const buffer = context.createBuffer(2, length, rate);
	for (let channel = 0; channel < 2; channel++) {
		const data = buffer.getChannelData(channel);
		for (let i = preDelay; i < length; i++) {
			const t = (i - preDelay) / (length - preDelay);
			data[i] = (Math.random() * 2 - 1) * (1 - t) ** decay;
		}
	}
	return buffer;
}

/** The most the music filter opens right now: the theme's cutoff, or much less backstage. */
const ceiling = () => (muffled ? 1100 : openCutoff);

/** Keep the scroll-speed filter open, for a glide that moves fast on purpose. */
export function holdOpen() {
	if (!ctx || !musicFilter) return;
	const now = ctx.currentTime;
	musicFilter.frequency.cancelScheduledValues(now);
	musicFilter.frequency.setTargetAtTime(ceiling(), now, 0.1);
}

/** `speed` is the scroll speed in pixels per second; 0 opens the filter again. */
export function setScrollSpeed(speed: number) {
	if (!ctx || !musicFilter) return;
	const amount = Math.min(1, speed / 3500);
	const top = ceiling();
	const cutoff = top * (Math.min(2200, top) / top) ** amount;
	musicFilter.frequency.setTargetAtTime(cutoff, ctx.currentTime, 0.12);
}

// The phone menu's overlay puts the page backstage: the music goes behind a
// closed door while it is open and comes back as it closes.
let muffled = false;
export function setMuffled(on: boolean) {
	muffled = on;
	if (!ctx || !musicFilter) return;
	const now = ctx.currentTime;
	musicFilter.frequency.cancelScheduledValues(now);
	musicFilter.frequency.setTargetAtTime(ceiling(), now, on ? 0.25 : 0.4);
}

// Dark mode is a little darker to listen to as well: the music loses some
// air. The theme is the saved data-theme on <html>, else the system setting.
let openCutoff = 16000;
const systemDark = matchMedia("(prefers-color-scheme: dark)");
function applyTheme() {
	const saved = document.documentElement.dataset.theme;
	const dark = saved ? saved === "dark" : systemDark.matches;
	openCutoff = dark ? 9000 : 16000;
	if (ctx && musicFilter) {
		musicFilter.frequency.setTargetAtTime(ceiling(), ctx.currentTime, 0.6);
	}
}
new MutationObserver(applyTheme).observe(document.documentElement, {
	attributes: true,
	attributeFilter: ["data-theme"],
});
systemDark.addEventListener("change", applyTheme);
applyTheme();

// Fade everything out while the tab is hidden, and wake the context when the
// tab returns, since some browsers suspend it while another app has the audio.
document.addEventListener("visibilitychange", () => {
	if (!ctx || !master) return;
	if (!document.hidden && enabled) void ctx.resume();
	const now = ctx.currentTime;
	master.gain.cancelScheduledValues(now);
	master.gain.setValueAtTime(master.gain.value, now);
	master.gain.linearRampToValueAtTime(document.hidden ? 0 : 0.5, now + 0.4);
});

export function vibrate(pattern: number | number[]) {
	if (!enabled) return;
	try {
		navigator.vibrate?.(pattern);
	} catch {}
}

const midiToHz = (note: number) => 440 * 2 ** ((note - 69) / 12);

/** A slow, warm synthwave chord. `notes` are MIDI note numbers. */
export function chord(notes: number[], length = 2.6) {
	if (!isEnabled() || !ctx || !master || !delaySend) return;
	const now = ctx.currentTime;

	const filter = ctx.createBiquadFilter();
	filter.type = "lowpass";
	filter.Q.value = 6;
	filter.frequency.setValueAtTime(260, now);
	filter.frequency.exponentialRampToValueAtTime(2600, now + 0.45);
	filter.frequency.exponentialRampToValueAtTime(700, now + length);

	const amp = ctx.createGain();
	amp.gain.setValueAtTime(0.0001, now);
	amp.gain.exponentialRampToValueAtTime(0.16, now + 0.18);
	amp.gain.exponentialRampToValueAtTime(0.0001, now + length);

	filter.connect(amp);
	amp.connect(master);
	amp.connect(delaySend);
	if (reverbSend) {
		const room = ctx.createGain();
		room.gain.value = 0.35;
		amp.connect(room);
		room.connect(reverbSend);
	}

	const saws: OscillatorNode[] = [];
	for (const note of notes) {
		for (const detune of [-8, 8]) {
			const osc = ctx.createOscillator();
			osc.type = "sawtooth";
			osc.frequency.value = midiToHz(note);
			osc.detune.value = detune;
			osc.connect(filter);
			osc.start(now);
			osc.stop(now + length + 0.1);
			saws.push(osc);
		}
	}
	trackVoice(amp, ...saws);

	// A soft sine an octave under the root.
	const sub = ctx.createOscillator();
	sub.type = "sine";
	sub.frequency.value = midiToHz(notes[0] - 12);
	const subAmp = ctx.createGain();
	subAmp.gain.setValueAtTime(0.0001, now);
	subAmp.gain.exponentialRampToValueAtTime(0.22, now + 0.12);
	subAmp.gain.exponentialRampToValueAtTime(0.0001, now + length);
	sub.connect(subAmp);
	subAmp.connect(master);
	sub.start(now);
	sub.stop(now + length + 0.1);
	trackVoice(subAmp, sub);
}

/** A short rising FM swoosh for the magnetic icons. `pan` is -1 to 1. */
export function magnet(pan = 0) {
	if (!isEnabled() || !ctx || !master) return;
	const now = ctx.currentTime;

	const carrier = ctx.createOscillator();
	carrier.type = "sine";
	carrier.frequency.setValueAtTime(240, now);
	carrier.frequency.exponentialRampToValueAtTime(720, now + 0.22);

	const modulator = ctx.createOscillator();
	modulator.frequency.value = 38;
	const depth = ctx.createGain();
	depth.gain.value = 60;
	modulator.connect(depth);
	depth.connect(carrier.frequency);

	const amp = ctx.createGain();
	amp.gain.setValueAtTime(0.0001, now);
	amp.gain.exponentialRampToValueAtTime(0.07, now + 0.04);
	amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

	const panner = ctx.createStereoPanner();
	panner.pan.value = Math.max(-1, Math.min(1, pan));

	carrier.connect(amp);
	amp.connect(panner);
	panner.connect(master);
	if (delaySend) panner.connect(delaySend);

	carrier.start(now);
	modulator.start(now);
	carrier.stop(now + 0.35);
	modulator.stop(now + 0.35);
}

/** A music-box note. */
export function bell(note: number, now: number, destination: AudioNode, ring = 1.3) {
	if (!ctx) return;
	const base = midiToHz(note);
	const amp = ctx.createGain();
	amp.gain.setValueAtTime(0.0001, now);
	amp.gain.exponentialRampToValueAtTime(0.2, now + 0.006);
	amp.gain.exponentialRampToValueAtTime(0.0001, now + ring);
	amp.connect(destination);

	const partials: [number, number, OscillatorType][] = [
		[1, 1, "sine"],
		[2, 0.25, "triangle"],
		[3.01, 0.08, "sine"],
	];
	const oscs: OscillatorNode[] = [];
	for (const [ratio, level, type] of partials) {
		const osc = ctx.createOscillator();
		osc.type = type;
		osc.frequency.value = base * ratio;
		const gain = ctx.createGain();
		gain.gain.value = level;
		osc.connect(gain);
		gain.connect(amp);
		osc.start(now);
		osc.stop(now + ring + 0.05);
		oscs.push(osc);
	}
	trackVoice(amp, ...oscs);
}

/** Quiet interface sounds for hover and toggle. `semitones` shifts the pitch. */
export function tick(semitones = 0) {
	const ratio = 2 ** (semitones / 12);
	blip(1900 * ratio, 1700 * ratio, 0.025, 0.025, "triangle");
}

export function click(open: boolean) {
	blip(open ? 620 : 880, open ? 880 : 620, 0.07, 0.06, "sine");
}

function blip(
	from: number,
	to: number,
	length: number,
	level: number,
	type: OscillatorType,
	send = 0,
) {
	if (!isEnabled() || !ctx || !master) return;
	const now = ctx.currentTime;
	const osc = ctx.createOscillator();
	osc.type = type;
	osc.frequency.setValueAtTime(from, now);
	osc.frequency.exponentialRampToValueAtTime(to, now + length);
	const amp = ctx.createGain();
	amp.gain.setValueAtTime(0.0001, now);
	amp.gain.exponentialRampToValueAtTime(level, now + 0.005);
	amp.gain.exponentialRampToValueAtTime(0.0001, now + length);
	osc.connect(amp);
	amp.connect(master);
	if (send && delaySend) {
		const echo = ctx.createGain();
		echo.gain.value = send;
		amp.connect(echo);
		echo.connect(delaySend);
	}
	osc.start(now);
	osc.stop(now + length + 0.02);
}

let noise: AudioBuffer | null = null;

/** The soft clack of a split-flap display. */
export function clack() {
	if (!isEnabled() || !ctx || !master) return;
	if (!noise) {
		noise = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
		const data = noise.getChannelData(0);
		for (let i = 0; i < data.length; i++) {
			data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3;
		}
	}
	const now = ctx.currentTime;
	const source = ctx.createBufferSource();
	source.buffer = noise;
	source.playbackRate.value = 0.8 + Math.random() * 0.4;
	const band = ctx.createBiquadFilter();
	band.type = "bandpass";
	band.frequency.value = 1800 + Math.random() * 900;
	band.Q.value = 1.4;
	const amp = ctx.createGain();
	amp.gain.value = 0.09;
	source.connect(band);
	band.connect(amp);
	amp.connect(master);
	source.start(now);
}

let white: AudioBuffer | null = null;

/** Two seconds of white noise, shared by the air and paper sounds. */
export function whiteNoise() {
	if (!ctx) return null;
	if (!white) {
		white = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
		const data = white.getChannelData(0);
		for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
	}
	return white;
}

/** Filtered noise whose centre sweeps from one frequency to another. */
function air(from: number, to: number, length: number, level: number, attack: number) {
	if (!isEnabled() || !ctx || !master) return;
	const buffer = whiteNoise();
	if (!buffer) return;
	const now = ctx.currentTime;
	const source = ctx.createBufferSource();
	source.buffer = buffer;
	source.loop = true;
	const band = ctx.createBiquadFilter();
	band.type = "bandpass";
	band.Q.value = 1.1;
	band.frequency.setValueAtTime(from, now);
	band.frequency.exponentialRampToValueAtTime(to, now + length);
	const amp = ctx.createGain();
	amp.gain.setValueAtTime(0.0001, now);
	amp.gain.exponentialRampToValueAtTime(level, now + attack);
	amp.gain.exponentialRampToValueAtTime(0.0001, now + length);
	source.connect(band);
	band.connect(amp);
	amp.connect(master);
	source.start(now);
	source.stop(now + length + 0.02);
}

/** Paper brushing paper: hovering the proclamation or the newspaper. `long` is a page turn. */
export function rustle(long = false) {
	if (long) {
		air(1200, 4200, 0.42, 0.09, 0.14);
	} else {
		air(2800, 1700, 0.13, 0.045, 0.02);
	}
}

/** A rising "off you go" for links that open somewhere else. `echo` lets it ring. */
export function launch(echo = false) {
	blip(520, 1180, 0.11, 0.06, "sine", echo ? 0.7 : 0);
	air(900, 3400, 0.17, 0.03, 0.03);
}

/** Air moving past when jumping to another section. `down` is the direction. */
export function whoosh(down = true) {
	if (down) air(2600, 420, 0.4, 0.075, 0.12);
	else air(420, 2600, 0.4, 0.075, 0.12);
}
