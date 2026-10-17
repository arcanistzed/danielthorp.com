// In-page links glide to their section with an ease-in-out curve that takes
// a little longer for longer jumps, instead of the browser's quick default.
// Any wheel, touch or key input stops the glide; reduced motion jumps at once.
// Dispatches "glide-start" (detail: { from, to, duration } in px and ms) and
// "glide-end" on window, so sound can follow the movement.

const still = matchMedia("(prefers-reduced-motion: reduce)");
let frame = 0;

const easeInOutCubic = (t: number) =>
	t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

function stop() {
	if (frame) window.dispatchEvent(new Event("glide-end"));
	cancelAnimationFrame(frame);
	frame = 0;
}

function glide(to: number, done: () => void) {
	stop();
	const from = window.scrollY;
	const distance = to - from;
	if (still.matches || Math.abs(distance) < 2) {
		window.scrollTo({ top: to, behavior: "instant" });
		done();
		return;
	}
	const duration = Math.min(1300, Math.max(600, 500 + Math.abs(distance) * 0.12));
	const start = performance.now();
	window.dispatchEvent(
		new CustomEvent("glide-start", { detail: { from, to, duration } }),
	);
	const step = (now: number) => {
		const t = Math.min(1, (now - start) / duration);
		window.scrollTo({ top: from + distance * easeInOutCubic(t), behavior: "instant" });
		if (t < 1) frame = requestAnimationFrame(step);
		else {
			frame = 0;
			window.dispatchEvent(new Event("glide-end"));
			done();
		}
	};
	frame = requestAnimationFrame(step);
}

export function installSmoothScroll() {
	for (const type of ["wheel", "touchstart", "keydown"]) {
		window.addEventListener(type, () => frame && stop(), { passive: true });
	}

	document.addEventListener("click", event => {
		if (event.defaultPrevented || event.button !== 0) return;
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
		if (!link) return;
		const id = link.getAttribute("href")!.slice(1);
		const target = id ? document.getElementById(id) : null;
		if (id && !target) return;
		event.preventDefault();

		const margin = target ? parseFloat(getComputedStyle(target).scrollMarginTop) || 0 : 0;
		const top = target ? target.getBoundingClientRect().top + window.scrollY - margin : 0;
		const max = document.documentElement.scrollHeight - window.innerHeight;
		history.pushState(null, "", id ? `#${id}` : location.pathname);

		glide(Math.max(0, Math.min(top, max)), () => {
			if (!target) return;
			// Move focus with the view so keyboard users continue from here.
			if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
			target.focus({ preventScroll: true });
		});
	});
}
