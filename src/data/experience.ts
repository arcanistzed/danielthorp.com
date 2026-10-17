// Experience shown in the "Experience" section. Work is newest first; the
// leadership list puts current roles first, then the rest roughly by date.
// Taken from the CV; bullets are lightly trimmed for the web.

export interface Role {
	title: string;
	org: string;
	dates: string;
	points: string[];
}

export const work: Role[] = [
	{
		title: "Power Platform Governance Analyst",
		org: "Canadian Forces Morale and Welfare Services",
		dates: "May 2026 to Aug 2026",
		points: [
			"Analyzed the Microsoft Power Platform inventory in Power BI to assess app and flow usage, ownership, governance risk, and migration readiness across the Default Environment.",
			"Coordinated the organization-wide rollout of updated data loss prevention policies: change management planning, documentation, stakeholder communications, and inquiry support.",
			"Worked with app and flow owners to confirm business purpose, usage, data sensitivity, and ownership, and documented recommendations for retention, migration, reassignment, quarantine, or deletion.",
		],
	},
	{
		title: "Web Content and Newsletter Writer",
		org: "University of Ottawa",
		dates: "Jan 2026 to Mar 2026",
		points: [
			"Reviewed, edited, and drafted content for The Gee, the University of Ottawa student newsletter, on campus events, services, and opportunities.",
			"Supported content planning and communications strategy to improve student awareness and engagement across digital channels.",
			"Published and maintained web content in Drupal, keeping information clear, accurate, and accessible.",
		],
	},
	{
		title: "DevOps Automation Developer",
		org: "Vretta",
		dates: "May 2025 to Aug 2025",
		points: [
			"Designed and delivered a self-service deployment platform that reduced staging environment provisioning from several hours of manual work to 8 to 25 minutes of automated setup.",
			"Built a one-click Angular and Feathers interface and a TypeScript-based orchestration service to create, monitor, and manage containerized staging environments for development, testing, and demonstrations.",
			"Built an Express service in TypeScript with SQLite to orchestrate deployments, with queuing, status tracking, cancellation, and a secure polling endpoint.",
			"Automated provisioning and teardown with Bash, Docker health checks, and Nginx routing, with fail-fast error handling.",
			"Moved costs from a per-environment model to a fixed footprint, and made it possible to run several environments at once across teams.",
			"Handled change management, requirements, stakeholder alignment, training, documentation, and handoff.",
		],
	},
	{
		title: "Deputy Returning Officer",
		org: "Elections Canada",
		dates: "Apr 2025",
		points: [
			"Administered ballot counting during the federal election, following Elections Canada rules and keeping the process sound.",
		],
	},
	{
		title: "Information Technology Consultant",
		org: "University of Ottawa Students’ Union",
		dates: "Jun 2024 to Aug 2024",
		points: [
			"Recruited and onboarded web and IT staff: wrote job descriptions, ran interviews, and made hiring recommendations.",
			"Managed the Students’ Union website, including job postings and content updates.",
			"Administered Microsoft 365 accounts, permissions, and security settings, and provided help desk support to staff and elected officials.",
			"Helped set up and configure point-of-sale systems for Union operations.",
		],
	},
	{
		title: "DevOps and Data Developer",
		org: "BlackBerry QNX",
		dates: "May 2023 to Aug 2023",
		points: [
			"Built interactive internal dashboards from customer usage and licensing data to support decisions.",
			"Built a sortable, paginated, searchable PHP table of customer license data for compliance analysis.",
			"Designed a SQL ETL pipeline that processed and analyzed more than 50,000 records.",
			"Analyzed End User License Agreement provisions to define compliance criteria, and reported potential violations.",
			"Refactored and modularized the existing codebase for maintainability and performance.",
		],
	},
	{
		title: "Software Developer",
		org: "The Forge VTT",
		dates: "Jun 2022 to May 2023",
		points: [
			"Led the overhaul of the content conversion process with an automated CLI script and programmatic image manipulation for tokenization.",
			"Improved data processing with new algorithms and regex pattern matching (about 30% better).",
			"Worked on the backend and frontend of the company website with Node.js, Express, Vue, MongoDB, and Bootstrap.",
			"Joined design discussions with colleagues and external partners, and provided technical customer support, including during outages.",
		],
	},
	{
		title: "Open-Source Module Developer",
		org: "Self-employed",
		dates: "Apr 2021 to Jan 2023",
		points: [
			"Built more than 12 open-source modules for the Foundry Virtual Tabletop platform, with more than 22,000 downloads combined.",
			"Funded the work through freelance commissions and Patreon sponsorships.",
			"Resolved more than 160 issues and contributed pull requests across more than 30 related projects.",
		],
	},
];

export const leadership: Role[] = [
	{
		title: "Co-President (previously Board Chair, President, VP, and Director)",
		org: "Capital Technology Network (Hack the Hill)",
		dates: "Nov 2022 to present",
		points: [
			"Co-led Hack the Hill III, bringing together more than 350 attendees and generating nearly 100 project submissions, including a civic technology collaboration.",
			"Led Hack the Hill II as president: 826 participants, 113 projects, and more than $95,000 raised.",
			"Previously Board Chair and Director at Large, leading governance, oversight, and strategic direction.",
			"Previously Vice-President of Operations, Vice-President of Governance, and President, leading strategy, chairing meetings, and representing the nonprofit externally.",
			"As Operations Director, managed operations, finance, and administrative systems, and drafted the organization’s legal documents, policies, and procedures.",
			"As Development Director, designed and built the event management platform (TypeScript, React, Next.js, Node.js, MySQL), the public website, and email infrastructure for more than 2,500 personalized messages, and taught workshops to more than 120 students.",
			"Rebuilt the Hack the Hill website in Astro, improving load speed elevenfold and reaching a perfect Lighthouse score.",
		],
	},
	{
		title: "Web Designer",
		org: "ClimaTalk",
		dates: "May 2026 to present",
		points: [
			"Designing and developing ClimaTalk’s website, including an interactive explorer of United Nations climate change conferences (COPs).",
		],
	},
	{
		title: "Board Director",
		org: "OpenMedia",
		dates: "Sep 2025 to present",
		points: [
			"OpenMedia is a nonprofit that defends digital rights by promoting privacy, access, and free expression online.",
			"As a director, I support its mission through governance and oversight.",
			"I’m the Chair of the Finance Committee, a member of the HR Committee, and have begun leading the strategic planning process.",
		],
	},
	{
		title: "President and Co-Founder",
		org: "uOttawa Digital Policy Association",
		dates: "Oct 2024 to present",
		points: [
			"Co-founded and lead a student organization focused on technology law, digital governance, and public policy.",
			"Drafted the constitution, chair meetings, and run finances, communications, and the website.",
			"Developing opportunities for students to engage with technology law and public policy, including discussions, workshops, and events concerning AI governance, privacy, cybersecurity, and digital rights.",
		],
	},
	{
		title: "Systems, Automation, and Web Lead",
		org: "Federal election campaign, Ottawa–Vanier–Gloucester",
		dates: "Jan 2025 to Apr 2025",
		points: [
			"Ran the campaign’s digital infrastructure across web, email, volunteer management, and campaign systems.",
			"Maintained the campaign website and added API-based features for real-time updates.",
			"Built an interactive volunteer shift calendar from the volunteer-management platform’s data.",
			"Automated volunteer onboarding by connecting JotForm, Action Network, and the volunteer platform, with personalized onboarding emails.",
			"Set up email blasts and events in Action Network, and canvassed, dropped literature, and helped get out the vote.",
		],
	},
	{
		title: "Vice-President of Internal Affairs",
		org: "Engineering Students’ Society, University of Ottawa",
		dates: "May 2025 to Sep 2025",
		points: [
			"Oversaw the Society’s sub-associations and led the team organizing the uOttawa Engineering Competition, a qualifier for the Ontario Engineering Competition.",
			"Led National Engineering Month events, managed internal operations, and recorded and published officer meeting minutes.",
			"Voting member of the Board of Directors.",
		],
	},
	{
		title: "Board Chair",
		org: "Engineering Students’ Society, University of Ottawa",
		dates: "May 2024 to Apr 2025",
		points: [
			"Chaired Board and member meetings under Robert’s Rules of Order.",
			"Led by-law and policy revisions, and created the Society’s first accountability tracker for executives and directors.",
		],
	},
	{
		title: "Board Chair",
		org: "Canadian Federation of Engineering Students",
		dates: "May 2024 to Aug 2024",
		points: [
			"Chaired the national Board of Directors and organized the Federation’s first online seasonal updates meeting.",
			"Created simplified bilingual agenda and motion templates.",
		],
	},
	{
		title: "Executive (Communications Commissioner)",
		org: "University of Ottawa Students’ Union",
		dates: "Nov 2023 to Apr 2024",
		points: [
			"Member of the executive committee of a $17.4M+ not-for-profit serving more than 40,000 members, overseeing communications, marketing, sponsorship, and outreach.",
			"Directed the 2024 General Elections: introduced a modern election platform and in-person voting, fixed email delivery with University IT, worked with legal counsel on voting integrity, and built a live turnout tracker.",
			"Built a Next.js election portal integrating uOttawa authentication with ElectionBuddy, simplifying voter access. The portal was used in subsequent elections that achieved record turnout.",
			"Chaired the Electoral Committee and drafted appeal decisions.",
			"Recovered access to CRA and Corporations Canada portals for regulatory filings.",
			"Ran town halls on elections and the Union Portal, and directed the Union Portal project for club administration and the Student Rights Centre.",
			"Led the communications strategy for the health insurance referendum, an accessibility-driven logo redesign, and the hiring of the Union’s first Ombudsman.",
		],
	},
	{
		title: "Director (Engineering Representative)",
		org: "University of Ottawa Students’ Union",
		dates: "May 2023 to Aug 2023",
		points: [
			"Represented the Faculty of Engineering on the Board of Directors.",
			"Drafted policy and by-law reforms adopted by the Board, and chaired committee meetings.",
		],
	},
	{
		title: "Advisory Committee Member",
		org: "University of Ottawa Engineering Endowment Fund",
		dates: "May 2023 to Jan 2025",
		points: [
			"Reviewed funding proposals and budgets, and helped allocate more than $400,000 to student engineering initiatives.",
		],
	},
	{
		title: "Co-Founder and Chair",
		org: "uOttawa Cybersecurity Club",
		dates: "Mar 2023 to May 2024",
		points: [
			"Founded the club and drafted its constitution.",
			"Built a full-stack Next.js capture-the-flag leaderboard for an event with more than 60 participants, hosted on AWS EC2 with Docker and Caddy.",
		],
	},
	{
		title: "Branch Executive",
		org: "IEEE uOttawa Student Branch",
		dates: "Feb 2023 to Apr 2024",
		points: [
			"Served as Vice-President Communications, Vice-President External Affairs, and Software Engineering Academic Commissioner.",
			"Co-organized a capture-the-flag competition and a large networking event.",
		],
	},
];

// Logos come from simple-icons by slug; null means no logo is available.
export const skills: { group: string; items: [string, string | null][] }[] = [
	{
		group: "Languages and markup",
		items: [
			["TypeScript", "typescript"],
			["JavaScript", "javascript"],
			["Python", "python"],
			["SQL", null],
			["PHP", "php"],
			["HTML", "html5"],
			["CSS", "css"],
			["Bash", "gnubash"],
			["Java", "openjdk"],
			["C#", "dotnet"],
			["LaTeX", "latex"],
		],
	},
	{
		group: "Frameworks",
		items: [
			["React", "react"],
			["Next.js", "nextdotjs"],
			["Node.js", "nodedotjs"],
			["Express", "express"],
			["Angular", "angular"],
			["Vue", "vuedotjs"],
			["Astro", "astro"],
			["Svelte", "svelte"],
			["Bootstrap", "bootstrap"],
		],
	},
	{
		group: "Infrastructure",
		items: [
			["Docker", "docker"],
			["Linux", "linux"],
			["Nginx", "nginx"],
			["Caddy", "caddy"],
			["Git", "git"],
			["Terraform", "terraform"],
			["Cloudflare", "cloudflare"],
			["AWS", null],
			["GitHub Actions", "githubactions"],
		],
	},
	{
		group: "Platforms and data",
		items: [
			["Microsoft 365", null],
			["Google Apps Script", "googleappsscript"],
			["Drupal", "drupal"],
			["WordPress", "wordpress"],
			["MySQL", "mysql"],
			["MongoDB", "mongodb"],
			["SQLite", "sqlite"],
		],
	},
	{
		group: "Applied AI",
		items: [
			["RAG and embeddings", null],
			["ChromaDB", null],
		],
	},
];
