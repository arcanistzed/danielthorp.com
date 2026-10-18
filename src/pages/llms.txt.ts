import type { APIRoute } from "astro";
import { leadership, work, type Role } from "../data/experience";
import { statuses } from "../data/now";
import { categories, projects } from "../data/projects";
import { description } from "../data/site";

// A plain Markdown summary of the home page for language models and other
// tools that read text rather than render pages (https://llmstxt.org). Built
// from the same data as the page, so the two can't drift apart.

const roles = (list: Role[]) =>
	list.map(role => `- ${role.title}, ${role.org} (${role.dates})`).join("\n");

const now = statuses
	.map(item => `- ${item.role}, ${item.where}: ${item.detail}`)
	.join("\n");

const projectList = categories
	.map(([key, label]) => {
		const items = projects
			.filter(project => project.category === key)
			.map(project => `- [${project.name}](https://github.com/${project.repo}): ${project.summary}`)
			.join("\n");
		return `### ${label}\n\n${items}`;
	})
	.join("\n\n");

const body = `# Daniel Thorp

> ${description} Bilingual in English and French, based in Ottawa, Canada.

Website: https://danielthorp.com/
Email: daniel@danielthorp.com

## Now

${now}

## Work experience

${roles(work)}

## Leadership and volunteering

${roles(leadership)}

## Projects

${projectList}

## Writing

Daniel writes about technology policy, digital rights, and AI on Substack: https://arcanistzed.substack.com (feed: https://arcanistzed.substack.com/feed).

## Profiles

- [GitHub](https://github.com/arcanistzed)
- [LinkedIn](https://www.linkedin.com/in/daniel-a-thorp/)
- [Substack](https://arcanistzed.substack.com)
- [Bluesky](https://bsky.app/profile/danielthorp.bsky.social)
- [X](https://x.com/arcanistzed)
- [Instagram](https://instagram.com/daniel.a.thorp)
`;

export const GET: APIRoute = () =>
	new Response(body, {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
