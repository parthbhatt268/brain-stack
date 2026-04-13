# Brain Stack

Build your own career path — one link at a time.

**Live:** [brain-stacked.netlify.app](https://brain-stacked.netlify.app)

---

## Project

Today's students don't follow a linear learning path. They constantly consume content across YouTube, Reddit, Instagram, TikTok, GitHub, and countless articles, jumping between AI research, guitar tutorials, and gardening tips. But none of it sticks. It disappears into forgotten bookmarks and saved posts that never get revisited. Students have no visibility into what they are actually building and no clarity on whether they are gravitating toward AI, music, or something else entirely.

Brain Stack gives that scattered learning a home. When something interesting shows up while scrolling, users hit the share button and send it straight to Brain Stack. It handles everything from there: extracting content from videos, posts, or articles, classifying it into the right category, and placing it onto a personal knowledge graph that grows with every save. That graph can be searched at any point, turning random media consumption into a visible career trajectory the student is building on their own terms.

---

## Outcome

**Clarity on direction** — as a student's graph grows, patterns emerge. The categories with the most nodes are the ones they keep coming back to. Brain Stack makes those interests visible, so a student can see their own career trajectory taking shape instead of guessing at it.

**Instant recall through semantic search** — a student can ask a natural language question like _"that video about training neural networks"_ and the app finds the right node using vector similarity, even if the query shares no words with the original content.

**Zero friction to save** — a student shares a URL and walks away. AI handles classification, subcategory, source detection, and summary automatically. The knowledge graph builds itself.

**Secured behind Google** — every node and search is private to the student. Signing in with Google keeps the entire knowledge base protected and persistent across every device.

---

## The Problem

The old playbook looked like this: study Module 1, complete Assignment 1, move to Module 2. Linear. Rigid. Prescribed. That model made sense for a world where career paths were fixed and information was scarce.

That world no longer exists.

Today's teenagers and students are scrolling through AI research on one tab, watching a guitar tutorial on the next, and saving a gardening post on Instagram — all in the same afternoon. Their curiosity doesn't follow a syllabus. Their interests are wide, fast-moving, and genuinely multi-disciplinary.

The problem is that all of this learning disappears. A saved post here, a browser bookmark there, a YouTube video forgotten by tomorrow. There's no place that holds it all together and shows you the bigger picture of what you're actually drawn to.

---

## What Brain Stack does

Brain Stack is a visual knowledge graph built for the way young people actually learn today.

Every link you save — a YouTube video about AI agents, a GitHub repo, a Reddit thread about soil composition, an Instagram post about guitar chords — becomes a node on an infinite canvas. The app automatically classifies it, writes a short summary, and places it into the right branch of your personal knowledge graph.

Over time, your graph starts to reveal something: the shape of your interests. Where do most of your nodes cluster? What topics do you keep coming back to? That's the path you're building — not one assigned to you, but one you're discovering yourself.

The goal isn't to replace structured learning. It's to give students a tool to capture the organic, interest-driven learning that's already happening, make sense of it, and use it to figure out where they actually want to go.

---

## How it works

1. **Paste any URL** — YouTube, GitHub, Instagram, Reddit, TikTok, articles, LinkedIn — anything you find interesting
2. **AI classifies it automatically** — the Claude API reads the content and assigns a category (AI, Guitar, Gardening, etc.), subcategory, source platform, and a short summary
3. **A node appears on your canvas** — colour-coded by category, with the platform's icon, connected into a growing tree
4. **Your graph takes shape** — each category becomes its own visual branch; the more you save, the clearer the picture gets
5. **Search and explore** — find anything you've ever saved, see how ideas connect, and understand where your curiosity actually lives

---

## Tech Stack

| Layer              | Technology                                                              |
| ------------------ | ----------------------------------------------------------------------- |
| Frontend           | React 19, Vite                                                          |
| Canvas / Graph     | @xyflow/react (ReactFlow v12)                                           |
| Icons              | Lucide React, React Icons                                               |
| Backend            | Node.js + Express                                                       |
| Database           | Supabase (PostgreSQL)                                                   |
| Vector search      | pgvector — cosine similarity on 768-dim embeddings                      |
| Embeddings         | Google Gemini `gemini-embedding-001`                                    |
| LLM classification | Google Gemini `gemini-2.5-flash`                                        |
| Auth               | Supabase Auth (Google OAuth) — JWT verified on every request            |
| Content extraction | Mozilla Readability, YouTube InnerTube API, Reddit JSON API, GitHub API |
| Frontend hosting   | Netlify                                                                 |
| Backend hosting    | Render                                                                  |

---

## Running locally

This project requires a number of environment variables (Supabase keys, Claude API key, backend URL, and more). Rather than configuring all of that from scratch, the easiest way to try Brain Stack is on the live site.

If you genuinely want to run it locally, feel free to reach out and I'll share the environment variables with you.

---

## Supported Platforms

Brain Stack has dedicated content extractors for the platforms where most learning actually happens. A few more are on the roadmap but not yet fully supported.

| Platform         | Status          | Notes                                                   |
| ---------------- | --------------- | ------------------------------------------------------- |
| YouTube          | Fully supported | Title, description, and metadata via InnerTube API      |
| Reddit           | Fully supported | Post content and thread context via Reddit JSON API     |
| GitHub           | Fully supported | Repo description, README, and metadata via GitHub API   |
| Articles / blogs | Fully supported | Clean text extraction via Mozilla Readability           |
| LinkedIn         | Planned         | Icon recognised; content extraction not yet implemented |
| Instagram        | Planned         | Icon recognised; content extraction not yet implemented |
| TikTok           | Planned         | Icon recognised; content extraction not yet implemented |

The goal is to eventually support every platform students and teenagers actually use. For now, YouTube, Reddit, GitHub, and web articles cover the majority of the content worth saving.

---

## Features

- **AI-powered classification** — paste a URL and the app figures out everything else: category, subcategory, source, and a plain-English summary
- **Infinite visual canvas** — pan and zoom across your entire knowledge graph
- **Multi-category graph** — each interest domain becomes its own colour-coded tree
- **Split view** — categories with subcategories branch into horizontal lanes for a richer layout
- **Semantic search** — ask a natural language question and the app finds the closest matching node using vector similarity
- **Undo / Redo & Cut / Paste** — full editing controls to keep your graph organised
- **Authentication** — your graph is private, persistent, and tied to your account
- **Dark & light theme**
