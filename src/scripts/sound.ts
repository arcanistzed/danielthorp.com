// Sound and haptics for the home page. Everything is synthesized with the
// Web Audio API, so there are no audio files. Nothing plays until the visitor
// turns sound on, and browsers only allow that from a click, tap or key press.

const STORAGE_KEY = "sound";

export type Pref = "on" | "off" | null;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let delaySend: GainNode | null = null;
let music: GainNode | null = null;
let musicFilter: BiquadFilterNode | null = null;
let enabled = false;
const scheduled = new Set<OscillatorNode>();

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
	if (!isEnabled() || !ctx || !master || !delaySend || !music) return null;
	return { ctx, master, delaySend, music };
}

/** Call from a click, tap or key handler so the browser lets audio start. */
export function setEnabled(on: boolean) {
	enabled = on;
	savePref(on);
	if (on) {
		ensureContext();
		void ctx?.resume();
	} else {
		for (const osc of scheduled) {
			try {
				osc.stop();
			} catch {}
		}
		scheduled.clear();
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

	// A dark feedback delay gives the pads their synthwave space.
	const delay = ctx.createDelay(1);
	delay.delayTime.value = 0.34;
	const feedback = ctx.createGain();
	feedback.gain.value = 0.38;
	const tone = ctx.createBiquadFilter();
	tone.type = "lowpass";
	tone.frequency.value = 1800;
	delaySend = ctx.createGain();
	delaySend.gain.value = 0.35;
	delaySend.connect(delay);
	delay.connect(tone);
	tone.connect(feedback);
	feedback.connect(delay);
	tone.connect(master);

	// The section beds go through one filter that closes a little while the
	// visitor scrolls quickly, like wind over the music.
	musicFilter = ctx.createBiquadFilter();
	musicFilter.type = "lowpass";
	musicFilter.frequency.value = 16000;
	musicFilter.Q.value = 0.3;
	musicFilter.connect(master);
	music = ctx.createGain();
	music.gain.value = 0.8;
	music.connect(musicFilter);
}

/** `speed` is the scroll speed in pixels per second; 0 opens the filter again. */
export function setScrollSpeed(speed: number) {
	if (!ctx || !musicFilter) return;
	const amount = Math.min(1, speed / 3500);
	const cutoff = 16000 * (2200 / 16000) ** amount;
	musicFilter.frequency.setTargetAtTime(cutoff, ctx.currentTime, 0.12);
}

// Fade everything out while the tab is hidden.
document.addEventListener("visibilitychange", () => {
	if (!ctx || !master) return;
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

	for (const note of notes) {
		for (const detune of [-8, 8]) {
			const osc = ctx.createOscillator();
			osc.type = "sawtooth";
			osc.frequency.value = midiToHz(note);
			osc.detune.value = detune;
			osc.connect(filter);
			osc.start(now);
			osc.stop(now + length + 0.1);
		}
	}

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
function bell(note: number, now: number, destination: AudioNode, ring = 1.3) {
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
		scheduled.add(osc);
		osc.onended = () => scheduled.delete(osc);
	}
}

/** [MIDI note or null for a rest, length in beats] */
export type Melody = [number | null, number][];

/**
 * Loops a melody on a music box while `start` is in effect, fading in and out.
 * Notes are scheduled a little ahead of time so the rhythm stays steady.
 */
export function musicBox(melody: Melody, bpm: number) {
	let gain: GainNode | null = null;
	let timer = 0;
	let index = 0;
	let nextTime = 0;
	let playing = false;
	const beat = 60 / bpm;

	function tick() {
		if (!ctx || !gain) return;
		while (nextTime < ctx.currentTime + 0.4) {
			const [note, beats] = melody[index];
			if (note !== null) bell(note, nextTime, gain, Math.min(2.4, beats * beat + 0.9));
			nextTime += beats * beat;
			index = (index + 1) % melody.length;
		}
	}

	return {
		start() {
			if (playing || !isEnabled() || !ctx || !master) return;
			playing = true;
			const now = ctx.currentTime;
			if (!gain) {
				gain = ctx.createGain();
				gain.connect(master);
				if (delaySend) {
					const send = ctx.createGain();
					send.gain.value = 0.5;
					gain.connect(send);
					send.connect(delaySend);
				}
			}
			gain.gain.cancelScheduledValues(now);
			gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now);
			gain.gain.exponentialRampToValueAtTime(0.9, now + 1.5);
			if (nextTime < now) nextTime = now + 0.1;
			clearInterval(timer);
			timer = window.setInterval(tick, 100);
			tick();
		},
		stop(fade = 1.5) {
			if (!playing || !ctx || !gain) return;
			playing = false;
			const now = ctx.currentTime;
			gain.gain.cancelScheduledValues(now);
			gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now);
			gain.gain.exponentialRampToValueAtTime(0.0001, now + fade);
			window.setTimeout(() => {
				if (!playing) clearInterval(timer);
			}, fade * 1000);
		},
		get playing() {
			return playing;
		},
	};
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

/** A rising "off you go" for links that open somewhere else. */
export function launch() {
	blip(520, 1180, 0.11, 0.06, "sine");
	air(900, 3400, 0.17, 0.03, 0.03);
	vibrate(10);
}

/** Air moving past when jumping to another section. `down` is the direction. */
export function whoosh(down = true) {
	if (down) air(2600, 420, 0.4, 0.075, 0.12);
	else air(420, 2600, 0.4, 0.075, 0.12);
	vibrate(8);
}
