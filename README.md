# Soustack Mise

A hosted workbench where rough recipe prose becomes an **always-valid Soustack recipe artifact**.

## Setup

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
GOOGLE_AI_API_KEY=your_key_here
```

**Getting your Google AI API Key:**
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and add it to your `.env.local` file

The app uses Google's Gemini 2.0 Flash API for recipe conversion, which has a generous free tier (1,500 requests/day).

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

## Features

- Convert freeform recipe text into structured Soustack JSON format
- AI-powered recipe parsing using Gemini 2.0 Flash
- Progressive recipe authoring with capability-based stacks
- Always-valid recipe artifacts
