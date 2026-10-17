// "Current status": what I'm doing right now. Edit this file to update the
// board; the "Updated" date comes from this file's last commit.

export interface Status {
	/** Short role, shown on the flaps. Keep it under about 20 characters. */
	role: string;
	where: string;
	href?: string;
	/** Short state, shown on the flaps. */
	status: string;
	/** One plain sentence with more detail. */
	detail: string;
}

export const updatedFallback = "October 2026";

export const statuses: Status[] = [
	{
		role: "Final year",
		where: "uOttawa Software Engineering",
		status: "Capstone",
		detail: "Most of my time goes to my courses and my capstone project.",
	},
	{
		role: "Researcher",
		where: "CRAIEDL",
		href: "https://www.craiedl.ca/",
		status: "In progress",
		detail:
			"Applying ethics to software requirements engineering for AI systems, with the Canadian Robotics and Artificial Intelligence Ethical Design Lab.",
	},
	{
		role: "Board director",
		where: "OpenMedia",
		href: "https://openmedia.org/",
		status: "Serving",
		detail: "On the board of a Canadian digital rights organization.",
	},
	{
		role: "COP explorer",
		where: "ClimaTalk",
		href: "https://climatalk.org/",
		status: "Building",
		detail: "An interactive explorer of the UN climate conferences.",
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
