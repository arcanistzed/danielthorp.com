// A synthesized bed for each section, cross-faded by how much of each is on
// screen. Every bed shares one key (A minor) and one tempo, so overlapping
// beds stay in tune, and most of them "pump" on every beat the way a
// sidechained progressive-house mix does. Sections opt in with
// data-bed="carbon" | "box" | "status" | "tree" | "matrix" | "paper".

import { audio, bell, BPM, setScrollSpeed, whiteNoise } from "./sound";

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
const chordAt = (step: number) =>
	CHORDS[Math.floor(step / PHRASE) % CHORDS.length];
const hz = (note: number) => 440 * 2 ** ((note - 69) / 12);
/** 0 to 1 and back over `period` steps, starting at 0. */
const cycle = (step: number, period: number) =>
	0.5 - 0.5 * Math.cos((2 * Math.PI * (step % period)) / period);

type Graph = NonNullable<ReturnType<typeof audio>>;

interface Voice {
	/** Called once per sixteenth while the bed is audible. */
	step?(step: number, time: number): void;
	/** Called when the bed becomes audible after silence. */
	wake?(step: number): void;
	stop(): void;
}

interface Bed {
	level: number;
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
	/** Oscillators per note, spread across ±detune cents. */
	voices?: number;
	detune?: number;
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

	const voices = o.voices ?? 2;
	const spread = o.detune ?? 7;
	for (const note of notes) {
		for (let v = 0; v < voices; v++) {
			const osc = ctx.createOscillator();
			osc.type = o.type ?? "sawtooth";
			osc.frequency.value = hz(note);
			osc.detune.value = voices === 1 ? 0 : -spread + (2 * spread * v) / (voices - 1);
			depth?.connect(osc.detune);
			osc.connect(filter);
			osc.start(start);
			osc.stop(end + o.release + 0.1);
		}
	}
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

	const voices = o.voices ?? 2;
	const spread = o.detune ?? 6;
	for (const note of notes) {
		for (let v = 0; v < voices; v++) {
			const osc = ctx.createOscillator();
			osc.type = "sawtooth";
			osc.frequency.value = hz(note);
			osc.detune.value = -spread + (2 * spread * v) / (voices - 1);
			osc.connect(filter);
			osc.start(time);
			osc.stop(time + length + 0.05);
		}
	}
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
	noiseBurst(g, out, time, { high: 7000, attack: 0.004, length: open ? 0.16 : 0.035, level });

/** Three quick bursts a few milliseconds apart, like several hands. */
function clap(g: Graph, out: AudioNode, time: number, level: number) {
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
function crackle(g: Graph, out: AudioNode) {
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
	amp.gain.value = 0.22;
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
		level: 1,
		pump: true,
		build(g, out, pump) {
			const floor = noiseFloor(g, out, "lowpass", 420, 0.035);
			const keep = padKeeper((start, end, chord, step) => {
				pad(g, pump, [chord[0] - 12, ...chord], start, end, {
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
				stop() {
					floor?.stop();
				},
			};
		},
	},

	// The proclamation: the music box, started from the top each time the
	// page scrolls back to it.
	box: {
		level: 0.9,
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
						if (when === local) bell(note, t, out, ring);
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
		level: 1,
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
				step(s, t) {
					const [bass, chord] = chordAt(s);
					const i = s % BAR;
					keep(s, t);
					if (i % 4 === 0) kick(g, out, t, 0.22, true);
					if (i % 4 === 2) {
						stab(g, pump, chord, t, STEP * 0.9, {
							cutoff: 350 + 2400 * cycle(s, LOOP * 2),
							level: 0.045,
							send: 0.15,
						});
					}
					if (i % 2 === 0) {
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
				step(s, t) {
					const [, chord] = chordAt(s);
					keep(s, t);
					if (s % 2 === 0) {
						const ladder = [...chord, ...chord.map(n => n + 12), chord[0] + 24];
						const i = (s / 2) % (ladder.length + 1);
						if (i < ladder.length) {
							pluck(g, pump, ladder[i], t, {
								type: "triangle",
								cutoff: 2800,
								decay: 0.45,
								level: 0.06,
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
		level: 1,
		pump: true,
		build(g, out, pump) {
			const GATE = [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0];
			const BASS = [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1];
			return {
				step(s, t) {
					const [bass, chord] = chordAt(s);
					const i = s % BAR;
					const loop = s % LOOP;
					if (i % 4 === 0) kick(g, out, t, 0.42);
					if (i === 4 || i === 12) clap(g, out, t, 0.09);
					if (i % 4 === 2) hat(g, out, t, 0.03);
					if (i === 14) hat(g, out, t, 0.035, true);
					if (loop === 0) hat(g, out, t, 0.05, true);
					if (GATE[i]) {
						stab(g, pump, [chord[0] - 12, ...chord], t, STEP * 0.65, {
							cutoff: 1900,
							level: 0.04,
							voices: 3,
							detune: 12,
						});
					}
					if (BASS[i]) {
						pluck(g, out, i === 15 ? bass + 12 : bass, t, {
							cutoff: 700,
							decay: 0.19,
							level: 0.16,
						});
					}
					if (loop === LOOP - BAR) riser(g, out, t, BAR * STEP, 0.07);
				},
				stop() {},
			};
		},
	},

	// Writing: late, after the club. Record surface, electric-piano chords
	// on the one, a slow wobbling dyad, and a sparse melody, all through a
	// closed-down filter.
	paper: {
		level: 1,
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
			return {
				step(s, t) {
					const [, chord] = chordAt(s);
					keep(s, t);
					if (s % BAR === 0) {
						for (const note of chord) keys(g, lofi, note - 12, t, 0.05);
					}
					if (s % 8 === 0) {
						const note = MELODY[(s / 8) % MELODY.length];
						if (note !== null) keys(g, lofi, note, t, 0.06, 0.7);
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
};

/* ---------- Transport and cross-fade ---------- */

interface Live {
	bed: Bed;
	/** Sections sharing this bed; the loudest one sets its level. */
	sections: HTMLElement[];
	gain: GainNode | null;
	pump: GainNode | null;
	voice: Voice | null;
	weight: number;
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

	// One instance per bed name, so two sections with the same bed (the hero
	// and the contact section both use "carbon") share it.
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
			pump: null,
			voice: null,
			weight: 0,
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
				entry.voice?.step?.(step, nextTime);
				if (entry.bed.pump && entry.pump && step % 4 === 0) duck(entry.pump, nextTime);
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
			entry.pump = null;
			entry.audible = false;
		}
	}

	// Each section's share of the viewport, on an equal-power curve.
	function measure() {
		frame = 0;
		const height = window.innerHeight;
		for (const entry of live.values()) {
			let share = 0;
			for (const section of entry.sections) {
				const rect = section.getBoundingClientRect();
				const visible = Math.max(0, Math.min(rect.bottom, height) - Math.max(rect.top, 0));
				share = Math.max(share, Math.min(1, visible / Math.min(height, rect.height || height)));
			}
			entry.weight = Math.sin((share * Math.PI) / 2);
		}
		apply();
	}

	function apply() {
		const g = audio();
		if (!g) return;
		const now = g.ctx.currentTime;
		let any = false;
		for (const entry of live.values()) {
			const audible = entry.weight > 0.002;
			if (audible && !entry.gain) {
				entry.gain = g.ctx.createGain();
				entry.gain.gain.value = 0;
				entry.gain.connect(g.music);
				entry.pump = g.ctx.createGain();
				entry.pump.connect(entry.gain);
				entry.voice = entry.bed.build(g, entry.gain, entry.pump);
			}
			if (audible && !entry.audible) entry.voice?.wake?.(step);
			entry.audible = audible;
			if (audible) any = true;
			entry.gain?.gain.setTargetAtTime(entry.weight * entry.bed.level, now, 0.35);
		}
		if (any) startTransport();
	}

	let frame = 0;
	const schedule = () => {
		if (!frame) frame = requestAnimationFrame(measure);
	};

	// Scroll speed drives the music filter; it opens again when scrolling stops.
	let lastY = window.scrollY;
	let lastAt = performance.now();
	let settle = 0;
	window.addEventListener(
		"scroll",
		() => {
			const now = performance.now();
			const dt = Math.max(16, now - lastAt);
			const speed = (Math.abs(window.scrollY - lastY) / dt) * 1000;
			lastY = window.scrollY;
			lastAt = now;
			setScrollSpeed(speed);
			clearTimeout(settle);
			settle = window.setTimeout(() => setScrollSpeed(0), 180);
			schedule();
		},
		{ passive: true },
	);
	window.addEventListener("resize", schedule);

	window.addEventListener("sound-change", event => {
		if ((event as CustomEvent<boolean>).detail) measure();
		else teardown();
	});

	if (import.meta.env.DEV) {
		(window as unknown as { __beds: () => Record<string, number> }).__beds = () => {
			measure();
			return Object.fromEntries([...live].map(([name, entry]) => [name, entry.weight]));
		};
	}

	measure();
}
