// A synthesized bed for each section, cross-faded by how much of each is on
// screen. Every bed shares one key (A minor) and one tempo, so overlapping
// beds stay in tune, and most of them "pump" on every beat the way a
// sidechained progressive-house mix does. Sections opt in with
// data-bed="carbon" | "box" | "status" | "tree" | "matrix" | "paper" | "outro".

import {
	audio,
	bell,
	BPM,
	holdOpen,
	setScrollSpeed,
	soundTier,
	trackVoice,
	vibrate,
	whiteNoise,
} from "./sound";

const STEP = 60 / BPM / 4; // one sixteenth note, in seconds
const LOOKAHEAD = 0.3;
const BAR = 16;
const PHRASE = 32; // sixteenths per chord: two bars
const LOOP = 128; // eight bars

// Am, F, C, G: [bass MIDI note, chord MIDI notes], voiced to move as little as possible.
const CHORDS: [number, number[]][] = [
	[45, [60, 64, 69]],
	[41, [60, 65, 69]],
	[48, [60, 64, 67]],
	[43, [59, 62, 67]],
];
// While the hero intro plays its own chords, every bed holds the key chord
// so the drone can stay under them without the progression fighting them.
let holdKey = false;
const chordAt = (step: number) =>
	holdKey ? CHORDS[0] : CHORDS[Math.floor(step / PHRASE) % CHORDS.length];
const hz = (note: number) => 440 * 2 ** ((note - 69) / 12);
/** 0 to 1 and back over `period` steps, starting at 0. */
const cycle = (step: number, period: number) =>
	0.5 - 0.5 * Math.cos((2 * Math.PI * (step % period)) / period);

type Graph = NonNullable<ReturnType<typeof audio>>;

// Wide pads cost oscillators; the lite tier gets two voices per note and no
// drift oscillators.
const maxVoices = () => (soundTier() === "full" ? 3 : 2);
const lite = () => soundTier() !== "full";

/** A few milliseconds either side of the grid, so hits don't land as a machine. */
const jitter = (ms: number) => ((Math.random() - 0.5) * ms) / 1000;
/** Level varied by up to ±`amount` of itself. */
const vary = (level: number, amount = 0.15) => level * (1 + (Math.random() * 2 - 1) * amount);

interface Voice {
	/**
	 * Called once per sixteenth while the bed is audible. `share` is how much
	 * of the screen the section holds, 0 to 1: beds bring their layers in one
	 * at a time as it rises and drop them in reverse as it falls.
	 */
	step?(step: number, time: number, share: number): void;
	/** Called when the bed becomes audible after silence. */
	wake?(step: number): void;
	/** How far through its section the page is, 0 to 1. */
	position?(p: number): void;
	/** How much of the viewport the bed's section holds, 0 to 1, as it scrolls in. */
	approach?(p: number): void;
	/** Where the pointer is over the section, 0 to 1 across and down. */
	pointer?(x: number, y: number): void;
	stop(): void;
}

interface Bed {
	level: number;
	/** How much of the bed goes to the room. */
	reverb: number;
	/** Duck the bed's pump bus on every beat. */
	pump: boolean;
	build(g: Graph, out: GainNode, pump: GainNode): Voice;
}

/* ---------- Instruments ---------- */

function sendTo(g: Graph, from: AudioNode, amount: number) {
	const send = g.ctx.createGain();
	send.gain.value = amount;
	from.connect(send);
	send.connect(g.delaySend);
}

interface PadOptions {
	type?: OscillatorType;
	cutoff: number;
	attack: number;
	release: number;
	level: number;
	/** Oscillators per note, spread across ±detune cents and across the stereo field. */
	voices?: number;
	detune?: number;
	/** How far the voices spread left and right, 0 to 1. */
	width?: number;
	send?: number;
	vibrato?: boolean;
}

/** Sustained detuned voices from `start` to `end`, with a slow filter swell. */
function pad(
	g: Graph,
	out: AudioNode,
	notes: number[],
	start: number,
	end: number,
	o: PadOptions,
) {
	const { ctx } = g;
	const filter = ctx.createBiquadFilter();
	filter.type = "lowpass";
	filter.Q.value = 0.9;
	filter.frequency.setValueAtTime(o.cutoff * 0.55, start);
	filter.frequency.linearRampToValueAtTime(o.cutoff, start + (end - start) * 0.6);
	filter.frequency.linearRampToValueAtTime(o.cutoff * 0.6, end + o.release);

	const amp = ctx.createGain();
	amp.gain.setValueAtTime(0, start);
	amp.gain.linearRampToValueAtTime(o.level, start + o.attack);
	amp.gain.setValueAtTime(o.level, end);
	amp.gain.linearRampToValueAtTime(0, end + o.release);
	filter.connect(amp);
	amp.connect(out);
	if (o.send) sendTo(g, amp, o.send);

	let depth: GainNode | null = null;
	if (o.vibrato) {
		const lfo = ctx.createOscillator();
		lfo.frequency.value = 4.3;
		depth = ctx.createGain();
		depth.gain.value = 7;
		lfo.connect(depth);
		lfo.start(start);
		lfo.stop(end + o.release + 0.1);
	}

	// A slow, slightly random drift in pitch, like an analogue oscillator warming.
	let driftDepth: GainNode | null = null;
	if (!lite()) {
		const drift = ctx.createOscillator();
		drift.frequency.value = 0.07 + Math.random() * 0.1;
		driftDepth = ctx.createGain();
		driftDepth.gain.value = 3;
		drift.connect(driftDepth);
		drift.start(start);
		drift.stop(end + o.release + 0.1);
	}

	const voices = Math.min(o.voices ?? 2, maxVoices());
	const spread = o.detune ?? 7;
	const width = o.width ?? 0.55;
	const oscs: OscillatorNode[] = [];
	for (const note of notes) {
		for (let v = 0; v < voices; v++) {
			const osc = ctx.createOscillator();
			osc.type = o.type ?? "sawtooth";
			osc.frequency.value = hz(note);
			const place = voices === 1 ? 0 : -1 + (2 * v) / (voices - 1);
			osc.detune.value = spread * place;
			depth?.connect(osc.detune);
			driftDepth?.connect(osc.detune);
			if (place === 0) {
				osc.connect(filter);
			} else {
				const panner = ctx.createStereoPanner();
				panner.pan.value = width * place;
				osc.connect(panner);
				panner.connect(filter);
			}
			osc.start(start);
			osc.stop(end + o.release + 0.1);
			oscs.push(osc);
		}
	}
	trackVoice(amp, ...oscs);
}

interface PluckOptions {
	type?: OscillatorType;
	cutoff: number;
	decay: number;
	level: number;
	send?: number;
	pan?: number;
}

/** One short note with a closing filter. */
function pluck(g: Graph, out: AudioNode, note: number, time: number, o: PluckOptions) {
	const { ctx } = g;
	const osc = ctx.createOscillator();
	osc.type = o.type ?? "sawtooth";
	osc.frequency.value = hz(note);

	const filter = ctx.createBiquadFilter();
	filter.type = "lowpass";
	filter.Q.value = 3;
	filter.frequency.setValueAtTime(o.cutoff * 2.4, time);
	filter.frequency.exponentialRampToValueAtTime(o.cutoff * 0.45, time + o.decay);

	const amp = ctx.createGain();
	amp.gain.setValueAtTime(0.0001, time);
	amp.gain.exponentialRampToValueAtTime(o.level, time + 0.008);
	amp.gain.exponentialRampToValueAtTime(0.0001, time + o.decay);

	osc.connect(filter);
	filter.connect(amp);
	let tail: AudioNode = amp;
	if (o.pan) {
		const panner = ctx.createStereoPanner();
		panner.pan.value = o.pan;
		amp.connect(panner);
		tail = panner;
	}
	tail.connect(out);
	if (o.send) sendTo(g, tail, o.send);
	osc.start(time);
	osc.stop(time + o.decay + 0.05);
	trackVoice(amp, osc);
}

interface StabOptions {
	cutoff: number;
	level: number;
	voices?: number;
	detune?: number;
	send?: number;
}

/** A gated chord: every note at once, cut off after `length` seconds. */
function stab(
	g: Graph,
	out: AudioNode,
	notes: number[],
	time: number,
	length: number,
	o: StabOptions,
) {
	const { ctx } = g;
	const filter = ctx.createBiquadFilter();
	filter.type = "lowpass";
	filter.Q.value = 2;
	filter.frequency.setValueAtTime(o.cutoff, time);
	filter.frequency.exponentialRampToValueAtTime(o.cutoff * 0.5, time + length);

	const amp = ctx.createGain();
	amp.gain.setValueAtTime(0.0001, time);
	amp.gain.exponentialRampToValueAtTime(o.level, time + 0.012);
	amp.gain.setValueAtTime(o.level, time + length * 0.7);
	amp.gain.exponentialRampToValueAtTime(0.0001, time + length);
	filter.connect(amp);
	amp.connect(out);
	sendTo(g, amp, o.send ?? 0.25);

	const voices = Math.min(o.voices ?? 2, maxVoices());
	const spread = o.detune ?? 6;
	const oscs: OscillatorNode[] = [];
	for (const note of notes) {
		for (let v = 0; v < voices; v++) {
			const osc = ctx.createOscillator();
			osc.type = "sawtooth";
			osc.frequency.value = hz(note);
			const place = voices === 1 ? 0 : -1 + (2 * v) / (voices - 1);
			osc.detune.value = spread * place;
			const panner = ctx.createStereoPanner();
			panner.pan.value = 0.4 * place;
			osc.connect(panner);
			panner.connect(filter);
			osc.start(time);
			osc.stop(time + length + 0.05);
			oscs.push(osc);
		}
	}
	trackVoice(amp, ...oscs);
}

/** A pitched sine thump. `muted` is a kick heard through a wall. */
function kick(g: Graph, out: AudioNode, time: number, level: number, muted = false) {
	const { ctx } = g;
	const osc = ctx.createOscillator();
	osc.type = "sine";
	osc.frequency.setValueAtTime(muted ? 120 : 165, time);
	osc.frequency.exponentialRampToValueAtTime(44, time + 0.11);
	const amp = ctx.createGain();
	amp.gain.setValueAtTime(0.0001, time);
	amp.gain.exponentialRampToValueAtTime(level, time + 0.004);
	amp.gain.exponentialRampToValueAtTime(0.0001, time + (muted ? 0.3 : 0.42));
	osc.connect(amp);
	let tail: AudioNode = amp;
	if (muted) {
		const low = ctx.createBiquadFilter();
		low.type = "lowpass";
		low.frequency.value = 180;
		amp.connect(low);
		tail = low;
	}
	tail.connect(out);
	osc.start(time);
	osc.stop(time + 0.5);
	trackVoice(amp, osc);

	if (!muted) {
		// The click on the front of the beater.
		noiseBurst(g, out, time, { high: 2500, attack: 0.001, length: 0.012, level: level * 0.5 });
	}
}

interface BurstOptions {
	high?: number;
	band?: number;
	attack: number;
	length: number;
	level: number;
}

/** A short shaped burst of noise. */
function noiseBurst(g: Graph, out: AudioNode, time: number, o: BurstOptions) {
	const { ctx } = g;
	const buffer = whiteNoise();
	if (!buffer) return;
	const source = ctx.createBufferSource();
	source.buffer = buffer;
	source.loop = true;
	let node: AudioNode = source;
	if (o.high) {
		const high = ctx.createBiquadFilter();
		high.type = "highpass";
		high.frequency.value = o.high;
		node.connect(high);
		node = high;
	}
	if (o.band) {
		const band = ctx.createBiquadFilter();
		band.type = "bandpass";
		band.frequency.value = o.band;
		band.Q.value = 1;
		node.connect(band);
		node = band;
	}
	const amp = ctx.createGain();
	amp.gain.setValueAtTime(0.0001, time);
	amp.gain.exponentialRampToValueAtTime(o.level, time + o.attack);
	amp.gain.exponentialRampToValueAtTime(0.0001, time + o.length);
	node.connect(amp);
	amp.connect(out);
	source.start(time, Math.random() * 1.5);
	source.stop(time + o.length + 0.02);
}

const hat = (g: Graph, out: AudioNode, time: number, level: number, open = false) =>
	noiseBurst(g, out, time + jitter(10), {
		high: 7000,
		attack: 0.004,
		length: open ? 0.16 : 0.035,
		level: vary(level, 0.2),
	});

/** Three quick bursts a few milliseconds apart, like several hands. */
function clap(g: Graph, out: AudioNode, time: number, level: number) {
	time += jitter(8);
	for (const offset of [0, 0.011, 0.022]) {
		noiseBurst(g, out, time + offset, { band: 1400, attack: 0.002, length: 0.03, level: level * 0.6 });
	}
	noiseBurst(g, out, time + 0.03, { band: 1600, attack: 0.002, length: 0.17, level });
}

/** Noise climbing from a rumble to a hiss over `length` seconds, then cut. */
function riser(g: Graph, out: AudioNode, time: number, length: number, level: number) {
	const { ctx } = g;
	const buffer = whiteNoise();
	if (!buffer) return;
	const source = ctx.createBufferSource();
	source.buffer = buffer;
	source.loop = true;
	const low = ctx.createBiquadFilter();
	low.type = "lowpass";
	low.Q.value = 1.5;
	low.frequency.setValueAtTime(250, time);
	low.frequency.exponentialRampToValueAtTime(9000, time + length);
	const amp = ctx.createGain();
	amp.gain.setValueAtTime(0.0001, time);
	amp.gain.exponentialRampToValueAtTime(level, time + length);
	amp.gain.setValueAtTime(0.0001, time + length + 0.001);
	source.connect(low);
	low.connect(amp);
	amp.connect(out);
	source.start(time);
	source.stop(time + length + 0.01);
}

/** A soft electric-piano note: a sine with a little triangle on top. */
function keys(g: Graph, out: AudioNode, note: number, time: number, level: number, send = 0.4) {
	pluck(g, out, note, time, { type: "sine", cutoff: 1800, decay: 1.5, level, send });
	pluck(g, out, note, time, { type: "triangle", cutoff: 900, decay: 0.9, level: level * 0.35 });
}

/** A bright piano stab, the eurodance kind: two detuned voices with a fast decay. */
function piano(g: Graph, out: AudioNode, notes: number[], time: number, level: number) {
	const { ctx } = g;
	const filter = ctx.createBiquadFilter();
	filter.type = "lowpass";
	filter.Q.value = 1;
	filter.frequency.setValueAtTime(5200, time);
	filter.frequency.exponentialRampToValueAtTime(1400, time + 0.22);
	const amp = ctx.createGain();
	amp.gain.setValueAtTime(0.0001, time);
	amp.gain.exponentialRampToValueAtTime(level, time + 0.005);
	amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.26);
	filter.connect(amp);
	amp.connect(out);
	sendTo(g, amp, 0.3);
	const oscs: OscillatorNode[] = [];
	for (const note of notes) {
		for (const [type, detune] of [["sawtooth", -5], ["square", 5]] as const) {
			const osc = ctx.createOscillator();
			osc.type = type;
			osc.frequency.value = hz(note);
			osc.detune.value = detune;
			const voice = ctx.createGain();
			voice.gain.value = type === "square" ? 0.35 : 1;
			osc.connect(voice);
			voice.connect(filter);
			osc.start(time);
			osc.stop(time + 0.3);
			oscs.push(osc);
		}
	}
	trackVoice(amp, ...oscs);
}

/** The rave hoover: detuned saws that swoop down an octave onto the note. */
function hoover(g: Graph, out: AudioNode, note: number, time: number, level: number) {
	const { ctx } = g;
	const filter = ctx.createBiquadFilter();
	filter.type = "lowpass";
	filter.Q.value = 2.5;
	filter.frequency.setValueAtTime(3200, time);
	filter.frequency.exponentialRampToValueAtTime(900, time + 1);
	const amp = ctx.createGain();
	amp.gain.setValueAtTime(0.0001, time);
	amp.gain.exponentialRampToValueAtTime(level, time + 0.02);
	amp.gain.setValueAtTime(level, time + 0.5);
	amp.gain.exponentialRampToValueAtTime(0.0001, time + 1.1);
	filter.connect(amp);
	amp.connect(out);
	sendTo(g, amp, 0.4);
	const oscs: OscillatorNode[] = [];
	for (const detune of [-28, 0, 28]) {
		const osc = ctx.createOscillator();
		osc.type = "sawtooth";
		osc.frequency.setValueAtTime(hz(note + 12), time);
		osc.frequency.exponentialRampToValueAtTime(hz(note), time + 0.35);
		osc.detune.value = detune;
		osc.connect(filter);
		osc.start(time);
		osc.stop(time + 1.15);
		oscs.push(osc);
	}
	trackVoice(amp, ...oscs);
}

/** The cursor's blink: a dry click on the beat. */
const cursor = (g: Graph, out: AudioNode, time: number, level: number) =>
	noiseBurst(g, out, time, { high: 4000, attack: 0.001, length: 0.006, level });

/** One typewriter key: the hammer's thud under a bright clack. */
function typeKey(g: Graph, out: AudioNode, time: number, level: number) {
	noiseBurst(g, out, time, { band: 2600, attack: 0.001, length: 0.028, level });
	const { ctx } = g;
	const thud = ctx.createOscillator();
	thud.type = "sine";
	thud.frequency.setValueAtTime(190, time);
	thud.frequency.exponentialRampToValueAtTime(90, time + 0.03);
	const amp = ctx.createGain();
	amp.gain.setValueAtTime(0.0001, time);
	amp.gain.exponentialRampToValueAtTime(level * 1.2, time + 0.002);
	amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
	thud.connect(amp);
	amp.connect(out);
	thud.start(time);
	thud.stop(time + 0.05);
}

/** The carriage return at the end of a line: the bell, then the carriage zips back. */
function carriageReturn(g: Graph, out: AudioNode, time: number, level: number) {
	const { ctx } = g;
	const ding = ctx.createOscillator();
	ding.type = "sine";
	ding.frequency.value = 1760;
	const amp = ctx.createGain();
	amp.gain.setValueAtTime(0.0001, time);
	amp.gain.exponentialRampToValueAtTime(level, time + 0.003);
	amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.5);
	ding.connect(amp);
	amp.connect(out);
	sendTo(g, amp, 0.3);
	ding.start(time);
	ding.stop(time + 0.55);
	trackVoice(amp, ding);
	const buffer = whiteNoise();
	if (!buffer) return;
	const zip = ctx.createBufferSource();
	zip.buffer = buffer;
	zip.loop = true;
	const band = ctx.createBiquadFilter();
	band.type = "bandpass";
	band.Q.value = 1.5;
	band.frequency.setValueAtTime(900, time + 0.08);
	band.frequency.exponentialRampToValueAtTime(2400, time + 0.22);
	const zipAmp = ctx.createGain();
	zipAmp.gain.setValueAtTime(0.0001, time + 0.08);
	zipAmp.gain.exponentialRampToValueAtTime(level * 0.5, time + 0.11);
	zipAmp.gain.exponentialRampToValueAtTime(0.0001, time + 0.24);
	zip.connect(band);
	band.connect(zipAmp);
	zipAmp.connect(out);
	zip.start(time + 0.08, Math.random() * 1.5);
	zip.stop(time + 0.26);
}

/** An endless loop of filtered noise. */
function noiseFloor(g: Graph, out: AudioNode, type: BiquadFilterType, frequency: number, level: number) {
	const { ctx } = g;
	const buffer = whiteNoise();
	if (!buffer) return null;
	const source = ctx.createBufferSource();
	source.buffer = buffer;
	source.loop = true;
	const filter = ctx.createBiquadFilter();
	filter.type = type;
	filter.frequency.value = frequency;
	const amp = ctx.createGain();
	amp.gain.value = level;
	source.connect(filter);
	filter.connect(amp);
	amp.connect(out);
	source.start();
	return source;
}

/** A looping record-surface texture: sparse crackle over faint hiss. */
function crackle(g: Graph, out: AudioNode, level = 0.22) {
	const { ctx } = g;
	const seconds = 4;
	const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < data.length; i++) {
		data[i] = (Math.random() * 2 - 1) * 0.04;
		if (Math.random() < 0.00022) {
			const size = (0.3 + Math.random() ** 2) * (Math.random() < 0.5 ? -1 : 1);
			const span = 2 + Math.floor(Math.random() * 4);
			for (let k = 0; k < span && i + k < data.length; k++) {
				data[i + k] += size * (1 - k / span);
			}
		}
	}
	const source = ctx.createBufferSource();
	source.buffer = buffer;
	source.loop = true;
	const band = ctx.createBiquadFilter();
	band.type = "bandpass";
	band.frequency.value = 2600;
	band.Q.value = 0.5;
	const amp = ctx.createGain();
	amp.gain.value = level;
	source.connect(band);
	band.connect(amp);
	amp.connect(out);
	source.start();
	return source;
}

/* ---------- The beds ---------- */

/** Schedules a pad for the rest of the current chord whenever none is sounding. */
function padKeeper(play: (start: number, end: number, chord: number[], step: number) => void) {
	let until = 0;
	return (step: number, time: number) => {
		if (time < until - 0.01) return;
		const end = time + (PHRASE - (step % PHRASE)) * STEP;
		play(time, end, chordAt(step)[1], step);
		until = end;
	};
}

// The About music box: openings of O Canada and God Save the King (both
// public domain), in C, an octave up. [MIDI note or null for a rest, beats].
const BOX_MELODY: [number | null, number][] = [
	[76, 3], [79, 1.5], [79, 0.5], [72, 4],
	[74, 1], [76, 1], [77, 1], [79, 1], [81, 1], [74, 4],
	[null, 2],
	[72, 1], [72, 1], [74, 1], [71, 1.5], [72, 0.5], [74, 1],
	[76, 1], [76, 1], [77, 1], [76, 1.5], [74, 0.5], [72, 1],
	[74, 1], [72, 1], [71, 1], [72, 3],
	[null, 3],
];

const BEDS: Record<string, Bed> = {
	// The hero: a dark room before the drop. A sub on the root, a wide
	// supersaw pad breathing against a beat that isn't there yet, and a slow
	// filter sweeping across sixteen bars.
	carbon: {
		level: 0.75,
		reverb: 0.35,
		pump: true,
		build(g, out, pump) {
			const floor = noiseFloor(g, out, "lowpass", 420, 0.035);
			// The pad follows the pointer like the hero's highlight does: left to
			// right across the stereo field, brighter toward the top.
			const { ctx } = g;
			const tone = ctx.createBiquadFilter();
			tone.type = "lowpass";
			tone.frequency.value = 2400;
			tone.Q.value = 0.7;
			const place = ctx.createStereoPanner();
			tone.connect(place);
			place.connect(pump);
			const keep = padKeeper((start, end, chord, step) => {
				pad(g, tone, [chord[0] - 12, ...chord], start, end, {
					cutoff: 500 + 1600 * cycle(step, LOOP * 2),
					attack: 2.4,
					release: 3,
					level: 0.04,
					voices: 3,
					detune: 14,
					send: 0.3,
				});
				pad(g, out, [chord[0] - 24], start, end, {
					type: "sine",
					cutoff: 300,
					attack: 1.4,
					release: 2,
					level: 0.16,
					voices: 1,
				});
			});
			return {
				step(s, t) {
					keep(s, t);
				},
				pointer(x, y) {
					const now = ctx.currentTime;
					place.pan.setTargetAtTime((x - 0.5) * 0.9, now, 0.25);
					tone.frequency.setTargetAtTime(600 * 6 ** (1 - y), now, 0.3);
				},
				stop() {
					floor?.stop();
				},
			};
		},
	},

	// The proclamation: the music box, started from the top each time the
	// page scrolls back to it.
	box: {
		level: 1.8,
		reverb: 0.45,
		pump: false,
		build(g, out) {
			sendTo(g, out, 0.5);
			let offset = 0;
			// Flatten the melody to [step offset, note, ring seconds] within one loop.
			const notes: [number, number, number][] = [];
			let at = 0;
			for (const [note, beats] of BOX_MELODY) {
				if (note !== null) notes.push([at, note, Math.min(2.4, beats * STEP * 4 + 0.9)]);
				at += beats * 4;
			}
			const length = at;
			return {
				wake(s) {
					offset = s;
				},
				step(s, t) {
					const local = (s - offset) % length;
					for (const [when, note, ring] of notes) {
						if (when !== local) continue;
						// Higher notes sit a little to the right, like a keyboard.
						const panner = g.ctx.createStereoPanner();
						panner.pan.value = ((note - 74) / 10) * 0.45;
						panner.connect(out);
						bell(note, t + jitter(12), panner, ring);
					}
				},
				stop() {},
			};
		},
	},

	// Current status: a departures board with a club through the wall. A
	// muted four-to-the-floor, disco chord chucks on the off-beats under a
	// sixteen-bar filter sweep, a bass pulse, and a relay tick on every beat.
	status: {
		level: 2,
		reverb: 0.18,
		pump: true,
		build(g, out, pump) {
			const keep = padKeeper((start, end, chord) =>
				pad(g, pump, chord, start, end, {
					cutoff: 900,
					attack: 1.4,
					release: 1.6,
					level: 0.05,
					send: 0.25,
				}),
			);
			return {
				step(s, t, share) {
					const [bass, chord] = chordAt(s);
					const i = s % BAR;
					keep(s, t);
					if (share >= 0.7 && i % 4 === 0) kick(g, out, t, 0.22, true);
					if (share >= 0.5 && i % 4 === 2) {
						stab(g, pump, chord, t, STEP * 0.9, {
							cutoff: 350 + 2400 * cycle(s, LOOP * 2),
							level: 0.045,
							send: 0.15,
						});
					}
					if (share >= 0.3 && i % 2 === 0) {
						pluck(g, out, bass, t, {
							cutoff: i % 4 === 0 ? 520 : 360,
							decay: 0.24,
							level: i % 4 === 0 ? 0.15 : 0.1,
						});
					}
					if (i % 4 === 0) {
						pluck(g, out, 105, t, { type: "sine", cutoff: 4000, decay: 0.03, level: 0.05, pan: (s / 4) % 2 ? 0.45 : -0.45 });
					}
				},
				stop() {},
			};
		},
	},

	// Experience: something growing. Warm pads, a low root, and plucks that
	// climb the chord and bounce back off the dotted-eighth delay.
	tree: {
		level: 1,
		reverb: 0.3,
		pump: true,
		build(g, out, pump) {
			const keep = padKeeper((start, end, chord) => {
				pad(g, pump, chord, start, end, {
					cutoff: 1500,
					attack: 2.2,
					release: 2.6,
					level: 0.045,
					voices: 3,
					detune: 11,
					send: 0.35,
				});
				pad(g, out, [chord[0] - 24], start, end, {
					type: "sine",
					cutoff: 400,
					attack: 1.2,
					release: 1.6,
					level: 0.13,
					voices: 1,
				});
			});
			return {
				step(s, t, share) {
					const [, chord] = chordAt(s);
					keep(s, t);
					if (share >= 0.45 && s % 2 === 0) {
						const ladder = [...chord, ...chord.map(n => n + 12), chord[0] + 24];
						const i = (s / 2) % (ladder.length + 1);
						if (i < ladder.length) {
							pluck(g, pump, ladder[i], t + jitter(8), {
								type: "triangle",
								cutoff: 2800,
								decay: 0.45,
								level: vary(0.06),
								send: 0.7,
								pan: (i / (ladder.length - 1)) * 0.8 - 0.4,
							});
						}
					}
				},
				stop() {},
			};
		},
	},

	// Projects: the drop. Kick on every beat, clap on two and four, hats on
	// the off-beats, an off-beat bass, sidechained supersaw stabs, and a
	// riser through the last bar of every eight.
	matrix: {
		level: 3.4,
		reverb: 0.1,
		pump: true,
		build(g, out, pump) {
			// A soft noise riser under the build as the grid scrolls into view,
			// gone once it fills the screen. The real build is the layering below.
			const { ctx } = g;
			const buffer = whiteNoise();
			const rise = ctx.createBiquadFilter();
			rise.type = "lowpass";
			rise.Q.value = 1.4;
			rise.frequency.value = 150;
			const riseGain = ctx.createGain();
			riseGain.gain.value = 0;
			rise.connect(riseGain);
			riseGain.connect(out);
			let riseSource: AudioBufferSourceNode | null = null;
			if (buffer) {
				riseSource = ctx.createBufferSource();
				riseSource.buffer = buffer;
				riseSource.loop = true;
				riseSource.connect(rise);
				riseSource.start();
			}
			return {
				approach(p) {
					const now = ctx.currentTime;
					const level = p < 0.85 ? 0.11 * (p / 0.85) ** 2 : 0.11 * (1 - (p - 0.85) / 0.15);
					riseGain.gain.setTargetAtTime(Math.max(0, level), now, 0.15);
					rise.frequency.setTargetAtTime(150 * 40 ** p, now, 0.15);
				},
				// Eurodance on a terminal, double-time on the shared grid: hats on
				// every sixteenth, an octave-bouncing bass, piano stabs on the
				// off-beats, a hoover on each chord change, a square-wave arpeggio
				// and the cursor blinking on the beat. Built layer by layer: hats,
				// bass, arpeggio, piano, clap, then the kick and the hoover.
				step(s, t, share) {
					const [bass, chord] = chordAt(s);
					const i = s % BAR;
					const loop = s % LOOP;
					if (share >= 0.85 && i % 4 === 0) kick(g, out, t, 0.34);
					if (share >= 0.7 && (i === 4 || i === 12)) clap(g, out, t, 0.09);
					if (share >= 0.15) {
						if (i % 4 === 2) hat(g, out, t, 0.035, true);
						else hat(g, out, t, i % 2 ? 0.016 : 0.022);
						if (i % 4 === 0) cursor(g, out, t, 0.06);
					}
					if (share >= 0.85 && loop === 0) hat(g, out, t, 0.05, true);
					if (share >= 0.3 && i % 2 === 0) {
						pluck(g, out, i % 4 === 0 ? bass : bass + 12, t, {
							cutoff: 800,
							decay: 0.17,
							level: 0.15,
						});
					}
					if (share >= 0.45) {
						const ladder = [...chord, ...chord.map(n => n + 12)];
						pluck(g, pump, ladder[i % ladder.length] + 12, t + jitter(4), {
							type: "square",
							cutoff: 3800,
							decay: 0.09,
							level: vary(0.03),
							pan: ((i % ladder.length) / (ladder.length - 1)) * 0.6 - 0.3,
						});
					}
					if (share >= 0.55 && i % 4 === 2) {
						piano(g, pump, [chord[0] - 12, ...chord], t + jitter(6), vary(0.07, 0.1));
					}
					if (share >= 0.85 && s % PHRASE === 0) hoover(g, pump, chord[0] - 12, t, 0.06);
					if (share >= 0.85 && loop === LOOP - BAR) riser(g, out, t, BAR * STEP, 0.07);
				},
				stop() {
					riseSource?.stop();
				},
			};
		},
	},

	// Writing: late, after the club. Record surface, electric-piano chords
	// on the one, a slow wobbling dyad, and a sparse melody, all through a
	// closed-down filter.
	paper: {
		level: 1.3,
		reverb: 0.28,
		pump: false,
		build(g, out) {
			const { ctx } = g;
			const lofi = ctx.createBiquadFilter();
			lofi.type = "lowpass";
			lofi.frequency.value = 2600;
			lofi.connect(out);
			const surface = crackle(g, out);
			const MELODY: (number | null)[] = [
				69, null, 72, 76, null, 74, 72, null, 67, null, 69, 72, null, 71, null, null,
			];
			const keep = padKeeper((start, end, chord) =>
				pad(g, lofi, [chord[0] - 12, chord[2] - 12], start, end, {
					type: "triangle",
					cutoff: 700,
					attack: 1.8,
					release: 2.4,
					level: 0.09,
					detune: 4,
					vibrato: true,
				}),
			);
			// Typing comes in bursts with pauses, like someone composing a line,
			// and the carriage returns at the end of every bar.
			const TYPING = [1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0];
			return {
				step(s, t, share) {
					const [, chord] = chordAt(s);
					const i = s % BAR;
					keep(s, t);
					if (share >= 0.4 && i === 0) {
						for (const note of chord) keys(g, lofi, note - 12, t, 0.05);
					}
					if (share >= 0.4 && TYPING[i] && Math.random() > 0.2) {
						typeKey(g, out, t + jitter(16), vary(0.05, 0.3));
					}
					if (share >= 0.6 && i === 15) carriageReturn(g, out, t, 0.07);
					if (share >= 0.6 && s % 8 === 0) {
						const note = MELODY[(s / 8) % MELODY.length];
						if (note !== null) keys(g, lofi, note, t + jitter(18), vary(0.06), 0.7);
					}
				},
				stop() {
					try {
						surface.stop();
					} catch {}
				},
			};
		},
	},

	// Contact: the end of the night. No pump and no drums. One chord held on
	// A minor nine that settles onto C major, the record still turning under
	// it, and a filter that closes as the page runs out.
	outro: {
		level: 0.65,
		reverb: 0.5,
		pump: false,
		build(g, out) {
			const { ctx } = g;
			const tone = ctx.createBiquadFilter();
			tone.type = "lowpass";
			tone.frequency.value = 3200;
			tone.Q.value = 0.7;
			tone.connect(out);
			const surface = crackle(g, out, 0.14);
			const floor = noiseFloor(g, tone, "lowpass", 380, 0.03);
			let offset = 0;
			let until = 0;
			return {
				wake(s) {
					offset = s;
					until = 0;
				},
				position(p) {
					tone.frequency.setTargetAtTime(3200 * (700 / 3200) ** p, ctx.currentTime, 0.4);
				},
				step(s, t) {
					if (t < until - 0.01) return;
					const local = s - offset;
					const end = t + (PHRASE - (local % PHRASE)) * STEP;
					const resolved = local >= PHRASE * 2;
					const chord = resolved ? [60, 64, 67, 72] : [60, 64, 67, 71];
					pad(g, tone, chord, t, end, {
						cutoff: 2400,
						attack: 2.8,
						release: 3.6,
						level: 0.05,
						voices: 3,
						detune: 9,
						send: 0.6,
					});
					pad(g, out, [resolved ? 36 : 33], t, end, {
						type: "sine",
						cutoff: 240,
						attack: 2,
						release: 3,
						level: 0.16,
						voices: 1,
					});
					until = end;
				},
				stop() {
					try {
						surface.stop();
					} catch {}
					floor?.stop();
				},
			};
		},
	},
};

/* ---------- Transport and cross-fade ---------- */

interface Live {
	bed: Bed;
	/** Sections sharing this bed; the loudest one sets its level. */
	sections: HTMLElement[];
	gain: GainNode | null;
	/** The bed's own filters, swept only during a nav glide. */
	high: BiquadFilterNode | null;
	low: BiquadFilterNode | null;
	/** After the filters: a steady send to the room, and an echo send for transitions. */
	verb: GainNode | null;
	echo: GainNode | null;
	pump: GainNode | null;
	voice: Voice | null;
	weight: number;
	/** The section's raw share of the viewport, before the fade curve. */
	share: number;
	/** The share at the previous measurement, to tell arriving from leaving. */
	lastShare: number;
	arriving: boolean;
	audible: boolean;
}

/** The sidechain: the pump bus dips on the beat and recovers before the next. */
function duck(pump: GainNode, time: number) {
	const p = pump.gain;
	p.cancelScheduledValues(time);
	p.setValueAtTime(1, time);
	p.linearRampToValueAtTime(0.3, time + 0.015);
	p.setTargetAtTime(1, time + 0.015, 0.11);
}

export function installBeds() {
	const sections = [...document.querySelectorAll<HTMLElement>("[data-bed]")].filter(
		el => el.dataset.bed! in BEDS,
	);
	if (!sections.length) return;

	// One instance per bed name, so two sections that name the same bed
	// share it.
	const live = new Map<string, Live>();
	for (const section of sections) {
		const name = section.dataset.bed!;
		const entry = live.get(name);
		if (entry) {
			entry.sections.push(section);
			continue;
		}
		live.set(name, {
			bed: BEDS[name],
			sections: [section],
			gain: null,
			high: null,
			low: null,
			verb: null,
			echo: null,
			pump: null,
			voice: null,
			weight: 0,
			share: 0,
			lastShare: 0,
			arriving: true,
			audible: false,
		});
	}

	let timer = 0;
	let step = 0;
	let nextTime = 0;
	let quietSince = 0;

	function tick() {
		const g = audio();
		if (!g) return stopTransport();
		const now = g.ctx.currentTime;
		if (nextTime < now - 1) nextTime = now;
		while (nextTime < now + LOOKAHEAD) {
			for (const entry of live.values()) {
				if (!entry.audible) continue;
				entry.voice?.step?.(step, nextTime, entry.share);
				if (entry.bed.pump && entry.pump && !holdKey && step % 4 === 0) duck(entry.pump, nextTime);
			}
			nextTime += STEP;
			step += 1;
		}
		if ([...live.values()].some(entry => entry.audible)) {
			quietSince = 0;
		} else {
			quietSince ||= performance.now();
			if (performance.now() - quietSince > 4000) stopTransport();
		}
	}

	function startTransport() {
		if (timer) return;
		const g = audio();
		if (!g) return;
		nextTime = g.ctx.currentTime + 0.05;
		quietSince = 0;
		timer = window.setInterval(tick, 100);
		tick();
	}

	function stopTransport() {
		clearInterval(timer);
		timer = 0;
	}

	function teardown() {
		stopTransport();
		for (const entry of live.values()) {
			entry.voice?.stop();
			entry.gain?.disconnect();
			entry.voice = null;
			entry.gain = null;
			entry.high = null;
			entry.low = null;
			entry.verb = null;
			entry.echo = null;
			entry.pump = null;
			entry.audible = false;
		}
	}

	// A nav glide hands the mix straight to the destination bed over the
	// glide's own duration, instead of the slower fade by viewport share,
	// and swaps the filters the way a DJ does: the outgoing bed is high-
	// passed away while the incoming bed's low-pass opens. The swap lasts at
	// least a bar so it reads as a transition even on a short glide.
	let glide: { bed: Live; seconds: number; at: number; to: number } | null = null;
	// Beds on their way out keep fading slowly until the swap has finished,
	// even after the scroll itself has stopped.
	let slowUntil = 0;

	/** The audio time of the next beat, so a change lands in time. */
	function nextBeat() {
		const g = audio();
		if (!g) return 0;
		if (!timer) return g.ctx.currentTime + 0.02;
		return nextTime + ((4 - (step % 4)) % 4) * STEP;
	}

	function swap(target: Live, seconds: number, at: number) {
		const g = audio();
		if (!g) return;
		const length = Math.max(seconds, BAR * STEP);
		for (const entry of live.values()) {
			if (!entry.high || !entry.low || !entry.echo) continue;
			const high = entry.high.frequency;
			const low = entry.low.frequency;
			const echo = entry.echo.gain;
			high.cancelScheduledValues(at);
			low.cancelScheduledValues(at);
			echo.cancelScheduledValues(at);
			if (entry === target) {
				high.setTargetAtTime(20, at, 0.05);
				low.setValueAtTime(entry.audible ? 16000 : 220, at);
				low.exponentialRampToValueAtTime(16000, at + length);
				echo.setTargetAtTime(0, at, 0.1);
			} else if (entry.audible) {
				low.setTargetAtTime(16000, at, 0.05);
				// The bass leaves first, while the bed is still clearly audible,
				// and its last notes trail off into echoes.
				high.setValueAtTime(Math.max(20, high.value), at);
				high.exponentialRampToValueAtTime(2400, at + length * 0.55);
				high.setTargetAtTime(20, at + length + 0.5, 0.3);
				echo.setValueAtTime(0, at);
				echo.linearRampToValueAtTime(0.6, at + length * 0.45);
				echo.linearRampToValueAtTime(0, at + length + 0.3);
			}
		}
	}
	window.addEventListener("glide-start", event => {
		const { to, duration } = (event as CustomEvent<{ to: number; duration: number }>).detail;
		const height = window.innerHeight;
		let best: Live | null = null;
		let bestOverlap = 0;
		for (const entry of live.values()) {
			for (const section of entry.sections) {
				const rect = section.getBoundingClientRect();
				const top = rect.top + window.scrollY;
				const overlap = Math.min(top + rect.height, to + height) - Math.max(top, to);
				if (overlap > bestOverlap) {
					bestOverlap = overlap;
					best = entry;
				}
			}
		}
		if (!best) return;
		const g = audio();
		if (!g) return;
		// The incoming bed's chain must exist before the swap, and the swap
		// waits for the next beat so the change lands in time.
		apply(0.3, best);
		const at = nextBeat();
		const seconds = duration / 1000;
		glide = { bed: best, seconds, at, to };
		slowUntil =
			performance.now() + (at - g.ctx.currentTime + Math.max(seconds, BAR * STEP)) * 1000;
		swap(best, seconds, at);
		holdOpen();
		measure();
	});
	/** An interrupted swap would leave a bed high-passed; bring everything back. */
	function unswap() {
		const g = audio();
		if (!g) return;
		const now = g.ctx.currentTime;
		for (const entry of live.values()) {
			if (!entry.high || !entry.low || !entry.echo) continue;
			for (const [param, value] of [
				[entry.high.frequency, 20],
				[entry.low.frequency, 16000],
				[entry.echo.gain, 0],
			] as const) {
				param.cancelScheduledValues(now);
				param.setTargetAtTime(value, now, 0.15);
			}
		}
		slowUntil = 0;
	}
	window.addEventListener("glide-end", () => {
		if (!glide) return;
		// A glide that reached its target lands with one light tap; an
		// interrupted one doesn't, and its half-done swap is undone.
		if (Math.abs(window.scrollY - glide.to) < 2) vibrate(10);
		else unswap();
		glide = null;
		measure();
	});

	// Each section's share of the viewport, on an equal-power curve. While the
	// hero intro plays its own chords the beds carry on underneath, pinned to
	// the key chord and without the pump. Over the last half viewport of the
	// page the final section takes over, since a short last section can never
	// fill the screen on its own.
	const root = document.documentElement;
	const last = sections[sections.length - 1];
	function measure() {
		frame = 0;
		const height = window.innerHeight;
		holdKey = root.classList.contains("intro");
		const fadeOut = Math.max(0.35, (slowUntil - performance.now()) / 2200);
		if (glide) {
			for (const entry of live.values()) {
				entry.weight = entry === glide.bed ? 1 : 0;
				entry.share = entry.weight;
			}
			apply(0.3, null, fadeOut, glide.at);
			return;
		}
		const endness = Math.max(
			0,
			Math.min(1, (window.scrollY + height - (root.scrollHeight - height / 2)) / (height / 2)),
		);
		for (const entry of live.values()) {
			let share = 0;
			for (const section of entry.sections) {
				const rect = section.getBoundingClientRect();
				const visible = Math.max(0, Math.min(rect.bottom, height) - Math.max(rect.top, 0));
				const own = Math.min(1, visible / Math.min(height, rect.height || height));
				const scaled = section === last ? Math.max(own, endness) : own * (1 - endness);
				share = Math.max(share, scaled);
				if (section === last && rect.height) {
					const through = (height - rect.top) / (rect.height + height);
					entry.voice?.position?.(Math.max(endness, Math.min(1, Math.max(0, through))));
				}
			}
			entry.weight = Math.sin((share * Math.PI) / 2);
			entry.share = share;
		}
		apply(0.35, null, fadeOut);
	}

	function apply(
		smoothing = 0.35,
		build: Live | null = null,
		fadeOut = smoothing,
		at = 0,
	) {
		const g = audio();
		if (!g) return;
		const now = Math.max(at, g.ctx.currentTime);
		let any = false;
		for (const entry of live.values()) {
			const audible = entry.weight > 0.002;
			if ((audible || entry === build) && !entry.gain) {
				entry.gain = g.ctx.createGain();
				entry.gain.gain.value = 0;
				entry.high = g.ctx.createBiquadFilter();
				entry.high.type = "highpass";
				entry.high.frequency.value = 20;
				entry.high.Q.value = 0.71;
				entry.low = g.ctx.createBiquadFilter();
				entry.low.type = "lowpass";
				entry.low.frequency.value = 16000;
				entry.low.Q.value = 0.71;
				entry.gain.connect(entry.high);
				entry.high.connect(entry.low);
				entry.low.connect(g.music);
				entry.verb = g.ctx.createGain();
				entry.verb.gain.value = entry.bed.reverb;
				entry.low.connect(entry.verb);
				entry.verb.connect(g.reverbSend);
				entry.echo = g.ctx.createGain();
				entry.echo.gain.value = 0;
				entry.low.connect(entry.echo);
				entry.echo.connect(g.delaySend);
				entry.pump = g.ctx.createGain();
				entry.pump.connect(entry.gain);
				entry.voice = entry.bed.build(g, entry.gain, entry.pump);
			}
			if (audible && !entry.audible) entry.voice?.wake?.(step);
			entry.audible = audible;
			entry.voice?.approach?.(entry.share);
			// The same filter swap as a nav glide, driven by the scroll: a bed
			// on its way in opens its low-pass as it takes the screen, a bed on
			// its way out loses its bass as it leaves. Reversing the scroll
			// reverses the roles. A glide drives the filters itself.
			if (entry.share !== entry.lastShare) entry.arriving = entry.share > entry.lastShare;
			if (entry.high && entry.low && at === 0 && performance.now() >= slowUntil) {
				const high = entry.arriving ? 20 : 20 * 120 ** (1 - entry.share);
				const low = entry.arriving
					? 220 * (16000 / 220) ** Math.min(1, entry.share * 1.15)
					: 16000;
				entry.high.frequency.setTargetAtTime(high, now, 0.2);
				entry.low.frequency.setTargetAtTime(low, now, 0.2);
			}
			entry.lastShare = entry.share;
			if (audible) any = true;
			entry.gain?.gain.setTargetAtTime(
				entry.weight * entry.bed.level,
				now,
				audible ? smoothing : fadeOut,
			);
		}
		if (any) startTransport();
	}

	let frame = 0;
	const schedule = () => {
		if (!frame) frame = requestAnimationFrame(measure);
	};

	// Scroll speed drives the music filter; it opens again when scrolling stops.
	// And a scroll that rests partway between two sections must not leave one
	// bed thinned out: after a moment at rest every bed's filters open, so the
	// mix settles into a plain blend until the scroll moves again.
	let lastY = window.scrollY;
	let lastAt = performance.now();
	let settle = 0;
	let rest = 0;
	function relax() {
		if (glide || performance.now() < slowUntil) {
			rest = window.setTimeout(relax, 500);
			return;
		}
		const g = audio();
		if (!g) return;
		const now = g.ctx.currentTime;
		for (const entry of live.values()) {
			entry.high?.frequency.setTargetAtTime(20, now, 0.6);
			entry.low?.frequency.setTargetAtTime(16000, now, 0.6);
		}
	}
	window.addEventListener(
		"scroll",
		() => {
			const now = performance.now();
			const dt = Math.max(16, now - lastAt);
			const speed = (Math.abs(window.scrollY - lastY) / dt) * 1000;
			lastY = window.scrollY;
			lastAt = now;
			if (!glide) {
				setScrollSpeed(speed);
				clearTimeout(settle);
				settle = window.setTimeout(() => setScrollSpeed(0), 180);
			}
			clearTimeout(rest);
			rest = window.setTimeout(relax, 1400);
			schedule();
		},
		{ passive: true },
	);
	window.addEventListener("resize", schedule);

	// Beds that listen to the pointer get its position over their section.
	for (const [, entry] of live) {
		for (const section of entry.sections) {
			let pending = 0;
			section.addEventListener(
				"pointermove",
				event => {
					if (pending || event.pointerType !== "mouse") return;
					pending = requestAnimationFrame(() => {
						pending = 0;
						const voice = entry.voice;
						if (!voice?.pointer) return;
						const rect = section.getBoundingClientRect();
						voice.pointer(
							Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
							Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
						);
					});
				},
				{ passive: true },
			);
		}
	}
	// The hero adds and removes the "intro" class on <html>.
	new MutationObserver(schedule).observe(root, { attributes: true, attributeFilter: ["class"] });

	// Turning sound off brakes the music like a record; the beds tear down
	// once it has come to rest, unless sound came back on in the meantime.
	window.addEventListener("sound-change", event => {
		if ((event as CustomEvent<boolean>).detail) {
			measure();
		} else {
			stopTransport();
			// The noise floors and crackle have no pitch to brake, so the bed
			// buses fade with it instead.
			for (const entry of live.values()) {
				entry.gain?.gain.setTargetAtTime(0, entry.gain.context.currentTime, 0.25);
			}
			window.setTimeout(() => {
				if (!audio()) teardown();
			}, 1000);
		}
	});

	// Nothing needs scheduling while the tab is hidden; the master is faded
	// out anyway. Measuring again on return restarts whatever is in view.
	document.addEventListener("visibilitychange", () => {
		if (document.hidden) stopTransport();
		else measure();
	});

	if (import.meta.env.DEV) {
		const dev = window as unknown as {
			__beds: () => Record<string, number>;
			__bedGains: () => Record<string, string | number>;
		};
		dev.__beds = () => {
			measure();
			return Object.fromEntries([...live].map(([name, entry]) => [name, entry.weight]));
		};
		dev.__bedGains = () =>
			Object.fromEntries(
				[...live].map(([name, entry]) => [
					name,
					+(entry.gain?.gain.value ?? 0).toFixed(3) + (entry.echo?.gain.value ? ` echo ${entry.echo.gain.value.toFixed(2)}` : ""),
				]),
			);
	}

	measure();
}
