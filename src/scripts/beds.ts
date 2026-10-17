// A synthesized bed for each section after the proclamation, cross-faded by
// how much of each section is on screen. Every bed shares one key (A minor)
// and the tempo of the About music box, so overlapping beds stay in tune.
// Sections opt in with data-bed="status" | "tree" | "matrix" | "paper".

import { audio, setScrollSpeed, whiteNoise } from "./sound";

const BPM = 76;
const STEP = 60 / BPM / 4; // one sixteenth note, in seconds
const LOOKAHEAD = 0.3;
const PHRASE = 32; // sixteenths per chord: two bars

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

type Graph = NonNullable<ReturnType<typeof audio>>;

interface Voice {
	/** Called once per sixteenth while the bed is audible. */
	step?(step: number, time: number): void;
	stop(): void;
}

interface Bed {
	level: number;
	build(g: Graph, out: GainNode): Voice;
}

/* ---------- Instruments ---------- */

interface PadOptions {
	type?: OscillatorType;
	cutoff: number;
	attack: number;
	release: number;
	level: number;
	detune?: number;
	send?: number;
	vibrato?: boolean;
}

/** Sustained detuned voices from `start` to `end`, with a slow filter swell. */
function pad(
	g: Graph,
	out: GainNode,
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
	if (o.send) {
		const send = ctx.createGain();
		send.gain.value = o.send;
		amp.connect(send);
		send.connect(g.delaySend);
	}

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

	const detune = o.detune ?? 7;
	for (const note of notes) {
		for (const d of [-detune, detune]) {
			const osc = ctx.createOscillator();
			osc.type = o.type ?? "sawtooth";
			osc.frequency.value = hz(note);
			osc.detune.value = d;
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
function pluck(g: Graph, out: GainNode, note: number, time: number, o: PluckOptions) {
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
	if (o.send) {
		const send = ctx.createGain();
		send.gain.value = o.send;
		tail.connect(send);
		send.connect(g.delaySend);
	}
	osc.start(time);
	osc.stop(time + o.decay + 0.05);
}

/** A gated chord: all notes at once, cut off after `length` seconds. */
function stab(
	g: Graph,
	out: GainNode,
	notes: number[],
	time: number,
	length: number,
	cutoff: number,
	level: number,
) {
	const { ctx } = g;
	const filter = ctx.createBiquadFilter();
	filter.type = "lowpass";
	filter.Q.value = 2;
	filter.frequency.setValueAtTime(cutoff, time);
	filter.frequency.exponentialRampToValueAtTime(cutoff * 0.5, time + length);

	const amp = ctx.createGain();
	amp.gain.setValueAtTime(0.0001, time);
	amp.gain.exponentialRampToValueAtTime(level, time + 0.012);
	amp.gain.setValueAtTime(level, time + length * 0.7);
	amp.gain.exponentialRampToValueAtTime(0.0001, time + length);
	filter.connect(amp);
	amp.connect(out);
	const send = ctx.createGain();
	send.gain.value = 0.25;
	amp.connect(send);
	send.connect(g.delaySend);

	for (const note of notes) {
		for (const d of [-6, 6]) {
			const osc = ctx.createOscillator();
			osc.type = "sawtooth";
			osc.frequency.value = hz(note);
			osc.detune.value = d;
			osc.connect(filter);
			osc.start(time);
			osc.stop(time + length + 0.05);
		}
	}
}

/** A burst of bright noise: a closed or open hi-hat. */
function hat(g: Graph, out: GainNode, time: number, level: number, open = false) {
	const { ctx } = g;
	const buffer = whiteNoise();
	if (!buffer) return;
	const length = open ? 0.14 : 0.035;
	const source = ctx.createBufferSource();
	source.buffer = buffer;
	source.loop = true;
	const high = ctx.createBiquadFilter();
	high.type = "highpass";
	high.frequency.value = 7000;
	const amp = ctx.createGain();
	amp.gain.setValueAtTime(0.0001, time);
	amp.gain.exponentialRampToValueAtTime(level, time + 0.004);
	amp.gain.exponentialRampToValueAtTime(0.0001, time + length);
	source.connect(high);
	high.connect(amp);
	amp.connect(out);
	source.start(time);
	source.stop(time + length + 0.02);
}

/** A tiny high sine, like a clock or a board relay. */
function clock(g: Graph, out: GainNode, time: number, pan: number) {
	const { ctx } = g;
	const osc = ctx.createOscillator();
	osc.type = "sine";
	osc.frequency.value = 2200;
	const amp = ctx.createGain();
	amp.gain.setValueAtTime(0.0001, time);
	amp.gain.exponentialRampToValueAtTime(0.05, time + 0.003);
	amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);
	const panner = ctx.createStereoPanner();
	panner.pan.value = pan;
	osc.connect(amp);
	amp.connect(panner);
	panner.connect(out);
	osc.start(time);
	osc.stop(time + 0.04);
}

/** A looping record-surface texture: sparse crackle over faint hiss. */
function crackle(g: Graph, out: GainNode) {
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
function padKeeper(play: (start: number, end: number, chord: number[]) => void) {
	let until = 0;
	return (step: number, time: number) => {
		if (time < until - 0.01) return;
		const end = time + (PHRASE - (step % PHRASE)) * STEP;
		play(time, end, chordAt(step)[1]);
		until = end;
	};
}

const BEDS: Record<string, Bed> = {
	// Current status: a departures board at night. A steady pulse under a
	// held chord, with a small relay tick on every beat.
	status: {
		level: 1,
		build(g, out) {
			const keep = padKeeper((start, end, chord) =>
				pad(g, out, chord, start, end, {
					cutoff: 900,
					attack: 1.4,
					release: 1.6,
					level: 0.06,
					send: 0.25,
				}),
			);
			return {
				step(s, t) {
					const [bass] = chordAt(s);
					keep(s, t);
					if (s % 2 === 0) {
						pluck(g, out, bass, t, {
							cutoff: s % 4 === 0 ? 520 : 360,
							decay: 0.24,
							level: s % 4 === 0 ? 0.16 : 0.11,
						});
					}
					if (s % 4 === 0) clock(g, out, t, (s / 4) % 2 ? 0.45 : -0.45);
				},
				stop() {},
			};
		},
	},

	// Experience: something growing. Warm pads, a low root, and an arpeggio
	// that climbs through the chord and starts again.
	tree: {
		level: 1,
		build(g, out) {
			const keep = padKeeper((start, end, chord) => {
				pad(g, out, chord, start, end, {
					cutoff: 1500,
					attack: 2.2,
					release: 2.6,
					level: 0.05,
					detune: 10,
					send: 0.35,
				});
				pad(g, out, [chord[0] - 24], start, end, {
					type: "sine",
					cutoff: 400,
					attack: 1.2,
					release: 1.6,
					level: 0.12,
					detune: 0,
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
							pluck(g, out, ladder[i], t, {
								type: "triangle",
								cutoff: 2600,
								decay: 0.5,
								level: 0.05,
								send: 0.6,
								pan: (i / (ladder.length - 1)) * 0.8 - 0.4,
							});
						}
					}
				},
				stop() {},
			};
		},
	},

	// Projects: a grid. Gated chord stabs on a sixteenth pattern, a plucked
	// bass line, and hats on the off-beats.
	matrix: {
		level: 1,
		build(g, out) {
			const GATE = [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0];
			const BASS = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1];
			return {
				step(s, t) {
					const [bass, chord] = chordAt(s);
					const i = s % 16;
					if (GATE[i]) stab(g, out, chord, t, STEP * 0.6, 1700, 0.045);
					if (BASS[i]) {
						pluck(g, out, i === 15 ? bass + 12 : bass, t, {
							cutoff: 650,
							decay: 0.17,
							level: 0.15,
						});
					}
					if (i % 4 === 2) hat(g, out, t, 0.03);
					if (i === 4 || i === 12) hat(g, out, t, 0.04, true);
				},
				stop() {},
			};
		},
	},

	// Writing: a quiet room with a record on. Surface noise, a slow wobbling
	// dyad, and a sparse melody with a long tail.
	paper: {
		level: 1,
		build(g, out) {
			const surface = crackle(g, out);
			const MELODY: (number | null)[] = [
				69, null, 72, 76, null, 74, 72, null, 67, null, 69, 72, null, 71, null, null,
			];
			const keep = padKeeper((start, end, chord) =>
				pad(g, out, [chord[0] - 12, chord[2] - 12], start, end, {
					type: "triangle",
					cutoff: 700,
					attack: 1.8,
					release: 2.4,
					level: 0.1,
					detune: 4,
					vibrato: true,
				}),
			);
			return {
				step(s, t) {
					keep(s, t);
					if (s % 8 === 0) {
						const note = MELODY[(s / 8) % MELODY.length];
						if (note !== null) {
							pluck(g, out, note, t, {
								type: "triangle",
								cutoff: 1400,
								decay: 1.7,
								level: 0.06,
								send: 0.7,
							});
						}
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
	gain: GainNode | null;
	voice: Voice | null;
	weight: number;
}

export function installBeds() {
	const sections = [...document.querySelectorAll<HTMLElement>("[data-bed]")].filter(
		el => el.dataset.bed! in BEDS,
	);
	if (!sections.length) return;

	const live = new Map<HTMLElement, Live>();
	for (const section of sections) {
		live.set(section, { bed: BEDS[section.dataset.bed!], gain: null, voice: null, weight: 0 });
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
				if (entry.weight > 0.002) entry.voice?.step?.(step, nextTime);
			}
			nextTime += STEP;
			step += 1;
		}
		const anyAudible = [...live.values()].some(entry => entry.weight > 0.002);
		if (anyAudible) {
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
		}
	}

	// Each section's share of the viewport, on an equal-power curve.
	function measure() {
		frame = 0;
		const height = window.innerHeight;
		for (const [section, entry] of live) {
			const rect = section.getBoundingClientRect();
			const visible = Math.max(0, Math.min(rect.bottom, height) - Math.max(rect.top, 0));
			const share = Math.min(1, visible / Math.min(height, rect.height || height));
			entry.weight = Math.sin((share * Math.PI) / 2);
		}
		apply();
	}

	function apply() {
		const g = audio();
		if (!g) return;
		const now = g.ctx.currentTime;
		let audible = false;
		for (const entry of live.values()) {
			if (entry.weight > 0.002) audible = true;
			if (!entry.gain && entry.weight > 0.002) {
				entry.gain = g.ctx.createGain();
				entry.gain.gain.value = 0;
				entry.gain.connect(g.music);
				entry.voice = entry.bed.build(g, entry.gain);
			}
			entry.gain?.gain.setTargetAtTime(entry.weight * entry.bed.level, now, 0.35);
		}
		if (audible) startTransport();
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
			return Object.fromEntries(
				[...live].map(([section, entry]) => [section.dataset.bed!, entry.weight]),
			);
		};
	}

	measure();
}
