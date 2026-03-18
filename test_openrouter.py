import httpx
import os
import asyncio
from dotenv import load_dotenv

load_dotenv('backend/.env')
api_key = os.getenv('OPENROUTER_API_KEY')

models = [
    "openrouter/free",
    "google/gemma-3-12b-it:free",
]

async def test_apis():
    print(f"API Key: {api_key[:10]}...{api_key[-4:] if api_key else 'None'}")
    async with httpx.AsyncClient(timeout=30.0) as client:
        for model in models:
            print(f"Testing {model}...")
            try:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://astraea.local",
                        "X-Title": "ASTRAEA Test"
                    },
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": "Hello"}],
                        "max_tokens": 10
                    }
                )
                print(f"  Status: {response.status_code}")
                if response.status_code != 200:
                    print(f"  Error: {response.text}")
                else:
                    data = response.json()
                    print(f"  Success! Response: {data['choices'][0]['message']['content']}")
            except Exception as e:
                print(f"  Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_apis())
