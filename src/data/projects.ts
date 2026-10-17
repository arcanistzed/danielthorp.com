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
					"A full-stack event management platform covering registration, check-ins, judging, schedules, maps, attendance tracking, and participant resources. What began as my first substantial full-stack project has grown through several editions of Hack the Hill. I designed its original architecture and have been its principal developer, working alongside contributors over the years.",
				tags: ["TypeScript", "Next.js", "React", "MySQL"],
			},
			{
				name: "Bulk email",
				repo: "HacktheHill/bulk-email",
				summary:
					"A reusable system for composing and sending large volumes of personalized emails using React Email. I’ve refined it over several years, and it has delivered tens of thousands of messages for Hack the Hill. A version was also used to send approximately 50,000 emails during my UOSU presidential campaign.",
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
					"The hackathon’s public site. I built much of the 2023 version, including its rebuild in Astro, and the 2026 version.",
				tags: ["TypeScript", "Astro", "Next.js"],
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
					"A lightweight photo gallery built for Hack the Hill III, featuring fast browsing, categorized albums, and clear licensing information before downloads.",
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
					"At a town hall I hosted after the 2024 elections, students asked for one link they could use to vote by signing in with their uOttawa account. The portal provides a single, shareable voting link using uOttawa credentials, avoiding reliance on individually emailed ballot links and the cost of purchasing an equivalent integration from the election vendor. It was subsequently used in elections that achieved record turnout.",
				tags: ["Next.js", "Microsoft Entra ID", "ElectionBuddy"],
			},
			{
				name: "Live turnout counter",
				repo: "arcanistzed/election-buddy-voter-turnout",
				summary:
					"A lightweight dashboard displaying live voter turnout during UOSU elections. Originally developed for the 2024 election, it remains in use.",
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
