## Teaching Mode

For every project, you MUST create and maintain a file called `FOR_WEIHAO.md`
(or your name) that explains this project in plain language.

### Required Content

1. **Technical Architecture** - How the system is designed and why
2. **Codebase Structure** - What each folder/file does and how they connect
3. **Technology Choices** - What tools/libraries are used and why they were chosen
4. **Decision Reasoning** - The thinking behind key technical decisions

### Lessons Learned Section

Always include:
- Specific bugs encountered and how they were fixed
- Potential pitfalls to avoid in the future
- Insights into how experienced engineers approach these problems
- Patterns and anti-patterns discovered

### Writing Style

- Engaging, NOT boring textbook tone
- Use analogies to explain complex concepts
- Include anecdotes that make information memorable
- Write as if explaining to a curious junior developer
- Make it something you'd actually want to read

## UX Rules

### Interactive Elements Must Look Interactive
When creating clickable elements (toggle badges, cycling buttons, action labels), ALWAYS add:
1. **Hint text** — a subtitle below the section heading explaining what's clickable and what it does (e.g., "Click the badge to cycle between include, defer, and skip")
2. **Tooltip** — a `title` attribute on the button (e.g., `title="Status: include. Click to cycle."`)
3. **Hover affordance** — visual feedback on hover like `hover:ring-2` so the element looks interactive

A badge that says "include" looks identical to a static label. Without hints, users will never discover they can click it.

### Attribution
Always include copyright: "Designed and implemented by Dr. Weihao Qu, Ling Zheng. Supported by LearnAI Team, CSSE Department, Monmouth University" — on the landing page footer and in the app sidebar. Use the LearnAI logo (`/learnai-logo.png`).
