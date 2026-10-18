// Where to find Daniel online. The hero floats these as icons and the footer
// lists them again, so both read from here.
import BlueskyIcon from "../components/icons/BlueskyIcon.astro";
import EmailIcon from "../components/icons/EmailIcon.astro";
import GitHubIcon from "../components/icons/GitHubIcon.astro";
import InstagramIcon from "../components/icons/InstagramIcon.astro";
import LinkedInIcon from "../components/icons/LinkedInIcon.astro";
import XIcon from "../components/icons/XIcon.astro";

export interface Social {
	label: string;
	href: string;
	aria: string;
	icon: typeof GitHubIcon;
}

export const email: Social = {
	label: "Email",
	href: "mailto:daniel@danielthorp.com",
	aria: "Send an email to Daniel Thorp",
	icon: EmailIcon,
};

export const profiles: Social[] = [
	{
		label: "GitHub",
		href: "https://github.com/arcanistzed",
		aria: "Daniel Thorp on GitHub (opens in new tab)",
		icon: GitHubIcon,
	},
	{
		label: "LinkedIn",
		href: "https://www.linkedin.com/in/daniel-a-thorp/",
		aria: "Daniel Thorp on LinkedIn (opens in new tab)",
		icon: LinkedInIcon,
	},
	{
		label: "Bluesky",
		href: "https://bsky.app/profile/danielthorp.bsky.social",
		aria: "Daniel Thorp on Bluesky (opens in new tab)",
		icon: BlueskyIcon,
	},
	{
		label: "Instagram",
		href: "https://instagram.com/daniel.a.thorp",
		aria: "Daniel Thorp on Instagram (opens in new tab)",
		icon: InstagramIcon,
	},
	{
		label: "X",
		href: "https://x.com/arcanistzed",
		aria: "Daniel Thorp on X (opens in new tab)",
		icon: XIcon,
	},
];
