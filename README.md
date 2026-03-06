# PDF Explainer

Web application untuk konversi PDF (soal matematika/fisika/kimia) menjadi penjelasan terstruktur dengan format chain of thoughts, kemudian export ke JSON.

## Features

- **PDF Upload**: Drag & drop PDF upload dengan preview
- **AI Analysis**: Konversi PDF ke penjelasan terstruktur menggunakan Claude Vision
- **LaTeX Rendering**: Render persamaan matematika dengan KaTeX
- **Verification**: Verifikasi kebenaran dengan Gemini AI
- **Export**: Export hasil ke format JSON

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Storage, Database, Edge Functions)
- **AI Models**:
  - Claude Vision API (PDF analysis)
  - Gemini API (verification)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL migration in `supabase/migrations/001_create_tables.sql`
3. Create a storage bucket named `pdfs` with public access
4. Copy your project URL and anon key

### 3. Configure Environment

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Deploy Edge Functions

Set the following secrets in your Supabase dashboard:

- `ANTHROPIC_API_KEY`: Your Claude API key
- `GEMINI_API_KEY`: Your Gemini API key

Deploy functions:

```bash
supabase functions deploy analyze-pdf
supabase functions deploy verify-correctness
```

### 5. Run Development Server

```bash
npm run dev
```

## Project Structure

```
pdf-explainer/
├── src/
│   ├── components/       # React components
│   │   ├── ui/          # Reusable UI components
│   │   └── ...          # Feature components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utilities and types
├── supabase/
│   ├── functions/       # Edge Functions
│   └── migrations/      # Database migrations
└── public/              # Static assets
```

## Output JSON Format

```json
{
  "id": "uuid",
  "filename": "soal_matematika.pdf",
  "subject": "matematika",
  "analysis": {
    "diketahui": "Diketahui $x^2 + 2x + 1 = 0$...",
    "ditanya": "Tentukan nilai $x$...",
    "jawaban": "Menggunakan rumus ABC:\n$$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$\n..."
  },
  "verification": {
    "isVerified": true,
    "checkedBy": "gemini",
    "confidence": 0.95
  },
  "metadata": {
    "createdAt": "2024-...",
    "exportedAt": "2024-..."
  }
}
```

## License

MIT
