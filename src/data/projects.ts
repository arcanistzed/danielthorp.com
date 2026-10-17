// Projects shown in the "Projects" section. Not exhaustive, and it leaves out
// work built during internships. Only public repositories are listed.

export interface Project {
	name: string;
	repo: string;
	summary: string;
	tags: string[];
}

export const projectGroups: { group: string; projects: Project[] }[] = [
	{
		group: "Hack the Hill",
		projects: [
			{
				name: "Track the Hack",
				repo: "HacktheHill/track-the-hack",
				summary:
					"Hack the Hill’s all-in-one event management platform: registration, judging, check-ins, live attendance counts, the event map and schedule, and resources for hackers. It was my first real full-stack project and my first time running a dev team. Many people have contributed over the years, but I’ve written most of the code and set the architecture.",
				tags: ["TypeScript", "Next.js", "React", "MySQL"],
			},
			{
				name: "Bulk email",
				repo: "HacktheHill/bulk-email",
				summary:
					"A tool I’ve refined over several years that makes it cheap and easy to send thousands of emails written in React, with good deliverability. It has sent tens of thousands of emails for Hack the Hill, and a version of it sent about 50,000 during my campaign for UOSU president.",
				tags: ["TypeScript", "React Email"],
			},
			{
				name: "Track the Hack bot",
				repo: "HacktheHill/track-the-hack-bot",
				summary:
					"Hack the Hill’s Discord bot. It spots tasks in the organizers’ server and creates them in OpenProject, schedules messages, syncs roles across servers, and handles hacker verification. I’m the main developer.",
				tags: ["TypeScript", "Discord"],
			},
			{
				name: "Hack the Hill website",
				repo: "HacktheHill/hackathon-website",
				summary:
					"The hackathon’s public site. I built much of the 2023 version and the 2026 version.",
				tags: ["TypeScript", "Next.js"],
			},
			{
				name: "Email list manager",
				repo: "HacktheHill/email-list-manager",
				summary:
					"Manages Hack the Hill’s mailing list, with subscribe and unsubscribe links and consent records for CASL compliance.",
				tags: ["TypeScript", "Cloudflare Workers", "D1"],
			},
			{
				name: "Reimbursement automation",
				repo: "HacktheHill/reimbursement-form-automation",
				summary:
					"Turns reimbursement form submissions into QuickBooks Online bills once two verified signatures are in. I built it while I was Operations Director.",
				tags: ["TypeScript", "QuickBooks API"],
			},
			{
				name: "Hack the Hill III photo album",
				repo: "HacktheHill/photo-album",
				summary:
					"A quick but solid photo album for attendees: fast browsing, categories, and the licence shown before each download.",
				tags: ["Astro", "React", "Cloudflare Workers", "R2"],
			},
			{
				name: "Capital Technology Network website",
				repo: "HacktheHill/org-website",
				summary:
					"The nonprofit’s site, with events and a blog, which I maintain.",
				tags: ["JavaScript"],
			},
		],
	},
	{
		group: "Student government",
		projects: [
			{
				name: "UOSU elections portal",
				repo: "arcanistzed/uosu-elections-portal",
				summary:
					"At a town hall I hosted after the 2024 elections, students asked for one link they could use to vote by signing in with their uOttawa account, instead of hunting for a personal link that often never reached their inbox. I built it. It saved the Students’ Union the cost of buying that integration from the election vendor, fixed the problem of missing ballot emails, and measurably raised turnout because the link can be shared.",
				tags: ["Next.js", "Microsoft Entra ID", "ElectionBuddy"],
			},
			{
				name: "Live turnout counter",
				repo: "arcanistzed/election-buddy-voter-turnout",
				summary:
					"Shows Students’ Union election turnout live, using a simple workaround. Still in use.",
				tags: ["TypeScript"],
			},
			{
				name: "ESS 101 Week contracts",
				repo: "arcanistzed/101week-contracts",
				summary:
					"A simple bilingual portal for collecting contract signatures, built when I was VP Internal of the Engineering Students’ Society.",
				tags: ["TypeScript"],
			},
		],
	},
	{
		group: "Foundry VTT modules, 2021 to 2023",
		projects: [
			{
				name: "PDF Sheet",
				repo: "arcanistzed/pdf-sheet",
				summary:
					"Exports a Foundry character sheet to a PDF, for any game system. It was simple and built so anyone could extend it, and a community grew around it (59 forks).",
				tags: ["JavaScript"],
			},
			{
				name: "Module Compatibility Checker",
				repo: "arcanistzed/mcc",
				summary:
					"Checks a module list against the next major Foundry version. Widely used, and my first Svelte interface, which I’m still proud of.",
				tags: ["JavaScript", "Svelte"],
			},
			{
				name: "Simultaneous Combat System",
				repo: "arcanistzed/scs",
				summary:
					"A small, good-looking interface that let people try a different combat system. My first paid commission.",
				tags: ["JavaScript"],
			},
			{
				name: "Custom Fonts",
				repo: "arcanistzed/custom-fonts",
				summary:
					"Use your own fonts or Google Fonts in journals, canvas text, or the whole interface. A simple fix that a lot of people used.",
				tags: ["JavaScript"],
			},
		],
	},
];
