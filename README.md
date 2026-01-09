# ASTRAEA - Professional Astrology Platform

A modern astrology web application that generates accurate natal charts and provides AI-powered interpretations, similar to astro.com.

## Features

✨ **Accurate Chart Calculations** - Powered by Immanuel (Swiss Ephemeris)
- Natal / Radix charts
- Transit charts
- Synastry charts
- Composite charts
- Solar Return
- Secondary Progressions

🎨 **Beautiful Visualization**
- SVG chart wheel with European-style rendering
- Zodiac signs with element colors
- House cusps and planetary positions
- Aspect lines

🤖 **AI Interpretation**
- Grounded interpretations based on actual chart data
- Multiple focus areas (personality, career, relationships, etc.)
- Multi-language support (EN/ES/NO)
- Streaming responses

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- OpenRouter API key (or OpenAI API key)

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY
python main.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

### Using Docker

```bash
# Create .env file with your API key
echo "OPENROUTER_API_KEY=your_key_here" > .env

# Start both services
docker-compose up
```

## Project Structure

```
ASTRO/
├── backend/                 # Python FastAPI backend
│   ├── main.py             # Application entry point
│   ├── routers/
│   │   ├── charts.py       # Chart calculation endpoints
│   │   └── interpret.py    # AI interpretation endpoints
│   └── services/
│       ├── chart_service.py # Immanuel wrapper
│       └── ai_service.py    # OpenRouter integration
│
├── frontend/                # React + TypeScript frontend
│   ├── src/
│   │   ├── App.tsx         # Main application
│   │   └── components/
│   │       ├── BirthDataForm.tsx
│   │       ├── ChartWheel.tsx
│   │       ├── ChartTables.tsx
│   │       └── Interpretation.tsx
│   └── index.html
│
└── docker-compose.yml       # Multi-service configuration
```

## API Endpoints

### Charts

- `POST /api/charts/natal` - Generate natal chart
- `POST /api/charts/transit` - Generate transit chart
- `POST /api/charts/synastry` - Generate synastry chart
- `POST /api/charts/composite` - Generate composite chart
- `POST /api/charts/solar-return` - Generate solar return
- `POST /api/charts/progressed` - Generate progressions
- `GET /api/charts/house-systems` - List supported house systems

### Interpretation

- `POST /api/interpret` - Get AI interpretation (supports streaming)
- `GET /api/focus-areas` - List interpretation focus areas

## Configuration

### House Systems

- Placidus (default)
- Koch
- Whole Sign
- Equal
- Regiomontanus
- Campanus
- Porphyry

### Celestial Bodies

Included by default:
- Sun through Pluto
- Chiron, Ceres, Pallas, Juno, Vesta
- North Node, South Node
- ASC, MC, DSC, IC

## License

This project is for educational and personal use.

## Credits

- [Immanuel](https://pypi.org/project/immanuel/) - Swiss Ephemeris Python wrapper
- [Swiss Ephemeris](https://www.astro.com/swisseph/) - High-precision astronomical calculations
- Design inspired by [astro.com](https://www.astro.com)
