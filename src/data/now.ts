// "Current status": what I'm doing right now. Edit this file to update the
// board; the "Updated" date comes from this file's last commit.

/** Flaps per row on the board. A longer role or status fails the build. */
export const ROLE_WIDTH = 18;
export const STATUS_WIDTH = 11;

export interface Status {
	/** Short role, shown on the flaps. At most ROLE_WIDTH characters. */
	role: string;
	where: string;
	href?: string;
	/** Short state, shown on the flaps. At most STATUS_WIDTH characters. */
	status: string;
	/** One plain sentence with more detail. */
	detail: string;
}

export const updatedFallback = "October 2026";

export const statuses: Status[] = [
	{
		role: "Final-year student",
		where: "uOttawa Software Engineering",
		status: "Studying",
		detail:
			"Completing my BASc in Software Engineering at the University of Ottawa, with coursework, research, and my capstone project as my main priorities.",
	},
	{
		role: "Undergrad research",
		where: "CRAIEDL",
		href: "https://www.craiedl.ca/",
		status: "Researching",
		detail:
			"As a member of the Canadian Robotics and Artificial Intelligence Ethical Design Lab, investigating how ethical considerations can be incorporated into software requirements engineering, particularly for AI-based systems, under the supervision of Professor Jason Millar.",
	},
	{
		role: "Board director",
		where: "OpenMedia",
		href: "https://openmedia.org/",
		status: "Serving",
		detail:
			"Serving on the Board of Directors of a Canadian digital rights organisation, with responsibilities spanning governance, finance, human resources, and strategic planning.",
	},
	{
		role: "COP explorer",
		where: "ClimaTalk",
		href: "https://climatalk.org/",
		status: "Building",
		detail:
			"Developing an interactive explorer of United Nations climate change conferences (COPs), making information about international climate negotiations easier to navigate and understand.",
	},
	{
		role: "Co-president",
		where: "Capital Technology Network",
		href: "https://hackthehill.com/",
		status: "Running",
		detail: "The nonprofit behind Hack the Hill.",
	},
	{
		role: "President",
		where: "uOttawa Digital Policy Association",
		href: "https://uodpa-apnuo.org/",
		status: "Co-founded",
		detail: "A student association for digital policy, which I co-founded.",
	},
];
