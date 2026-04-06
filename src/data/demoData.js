export const demoNodes = [
  // ── Gardening (4 nodes, subcategory: null — default chronological mode) ───
  {
    id: 'node-1',
    category: 'gardening',
    subcategory: null,
    source: 'youtube',
    url: 'https://youtube.com/watch?v=abc123',
    summary:
      'A beginner-friendly guide to starting a raised bed vegetable garden in small spaces, covering soil prep, seed selection, and seasonal planting tips for beginners.',
    datetime: '2025-02-10T09:00:00Z',
    origin: 'shared',
  },
  {
    id: 'node-2',
    category: 'gardening',
    subcategory: null,
    source: 'reddit',
    url: 'https://reddit.com/r/gardening/comments/xyz',
    summary:
      'Community discussion on companion planting techniques that naturally repel pests without chemicals, with photo evidence from multiple growing zones across the US.',
    datetime: '2025-04-22T14:30:00Z',
    origin: 'added',
  },
  {
    id: 'node-3',
    category: 'gardening',
    subcategory: null,
    source: 'article',
    url: 'https://gardenersworld.com/composting-101',
    summary:
      'Step-by-step composting guide explaining green vs brown materials, ideal ratios, troubleshooting smelly bins, and when compost is ready to use in your garden.',
    datetime: '2025-06-15T11:00:00Z',
    origin: 'suggested',
  },
  {
    id: 'node-4',
    category: 'gardening',
    subcategory: null,
    source: 'instagram',
    url: 'https://instagram.com/p/garden_inspo_42',
    summary:
      'Beautiful vertical garden installation on a balcony using recycled pallets and drip irrigation, perfect inspiration for urban apartment dwellers with limited outdoor space.',
    datetime: '2025-08-03T16:45:00Z',
    origin: 'shared',
  },

  // ── Guitar (4 nodes, subcategory: null — default chronological mode) ──────
  {
    id: 'node-5',
    category: 'guitar',
    subcategory: null,
    source: 'youtube',
    url: 'https://youtube.com/watch?v=gtr456',
    summary:
      'Detailed tutorial on fingerpicking patterns for acoustic guitar, starting with Travis picking and building up to complex folk arrangements for intermediate players.',
    datetime: '2025-01-18T10:00:00Z',
    origin: 'added',
  },
  {
    id: 'node-6',
    category: 'guitar',
    subcategory: null,
    source: 'reddit',
    url: 'https://reddit.com/r/guitar/comments/tuning',
    summary:
      'Thread comparing different alternate tunings like DADGAD and Open G, with audio samples and tablature for iconic songs recorded using each alternate tuning.',
    datetime: '2025-03-05T20:15:00Z',
    origin: 'shared',
  },
  {
    id: 'node-7',
    category: 'guitar',
    subcategory: null,
    source: 'article',
    url: 'https://guitarworld.com/pentatonic-mastery',
    summary:
      'In-depth article on pentatonic scale positions across the fretboard with exercises to connect all five shapes for fluid improvisation in any musical key.',
    datetime: '2025-05-28T08:30:00Z',
    origin: 'suggested',
  },
  {
    id: 'node-8',
    category: 'guitar',
    subcategory: null,
    source: 'tiktok',
    url: 'https://tiktok.com/@guitarlessons/video/789',
    summary:
      'Quick 60-second lesson showing how to play a classic rock intro riff using just three power chords and palm muting technique for a heavy rhythmic sound.',
    datetime: '2025-07-12T19:00:00Z',
    origin: 'added',
  },

  // ── AI (9 nodes, pre-assigned to 3 subcategories — starts in split mode) ──

  // Machine Learning (3)
  {
    id: 'node-13',
    category: 'ai',
    subcategory: 'Machine Learning',
    source: 'youtube',
    url: 'https://youtube.com/watch?v=ml_basics',
    summary:
      'Clear explainer on how neural networks learn through backpropagation, covering gradient descent intuitively with visual animations and practical NumPy code examples for beginners.',
    datetime: '2025-01-05T09:00:00Z',
    origin: 'suggested',
  },
  {
    id: 'node-14',
    category: 'ai',
    subcategory: 'Machine Learning',
    source: 'article',
    url: 'https://huggingface.co/blog/transfer-learning',
    summary:
      'Comprehensive walkthrough of transfer learning strategies using HuggingFace transformers, explaining when to freeze layers, learning rate schedules, and avoiding catastrophic forgetting.',
    datetime: '2025-03-15T12:00:00Z',
    origin: 'added',
  },
  {
    id: 'node-11',
    category: 'ai',
    subcategory: 'Machine Learning',
    source: 'article',
    url: 'https://arxiv.org/abs/2025.01234',
    summary:
      'Research paper introducing a novel fine-tuning approach that reduces compute costs by 80% while maintaining comparable performance on standard NLP and vision benchmarks.',
    datetime: '2025-06-01T15:20:00Z',
    origin: 'suggested',
  },

  // LLM & Prompting (4)
  {
    id: 'node-10',
    category: 'ai',
    subcategory: 'LLM & Prompting',
    source: 'linkedin',
    url: 'https://linkedin.com/posts/ai-trends-2025',
    summary:
      'Industry analysis post discussing how retrieval-augmented generation is reshaping enterprise search and knowledge management workflows across legal, finance, and healthcare sectors.',
    datetime: '2025-04-10T07:45:00Z',
    origin: 'shared',
  },
  {
    id: 'node-15',
    category: 'ai',
    subcategory: 'LLM & Prompting',
    source: 'article',
    url: 'https://learnprompting.org/advanced-techniques',
    summary:
      'Advanced prompt engineering guide covering chain-of-thought, few-shot examples, and self-consistency techniques that dramatically improve LLM output quality on complex reasoning tasks.',
    datetime: '2025-05-12T10:30:00Z',
    origin: 'added',
  },
  {
    id: 'node-16',
    category: 'ai',
    subcategory: 'LLM & Prompting',
    source: 'reddit',
    url: 'https://reddit.com/r/MachineLearning/comments/llm_eval',
    summary:
      'Deep discussion on LLM evaluation frameworks, comparing HELM, BIG-bench, and custom human preference evals, with insights on gaming benchmarks and what truly measures capability.',
    datetime: '2025-08-18T14:00:00Z',
    origin: 'shared',
  },
  {
    id: 'node-12',
    category: 'ai',
    subcategory: 'LLM & Prompting',
    source: 'youtube',
    url: 'https://youtube.com/watch?v=ai_demo',
    summary:
      'Live demo of a multimodal AI agent that can browse the web, write and execute code, and explain its step-by-step reasoning chain in real time with human oversight.',
    datetime: '2025-09-20T13:00:00Z',
    origin: 'added',
  },

  // AI Tools & Products (2)
  {
    id: 'node-9',
    category: 'ai',
    subcategory: 'AI Tools & Products',
    source: 'github',
    url: 'https://github.com/openai/whisper',
    summary:
      'Open-source automatic speech recognition model by OpenAI supporting multilingual transcription and translation with impressive accuracy across 99 languages and diverse audio conditions.',
    datetime: '2025-02-25T12:00:00Z',
    origin: 'added',
  },
  {
    id: 'node-17',
    category: 'ai',
    subcategory: 'AI Tools & Products',
    source: 'article',
    url: 'https://a16z.com/ai-coding-tools-comparison',
    summary:
      'Side-by-side comparison of AI coding assistants including Copilot, Cursor, and Codeium on real-world tasks, measuring code quality, latency, and developer satisfaction scores.',
    datetime: '2025-06-30T09:15:00Z',
    origin: 'suggested',
  },
];
