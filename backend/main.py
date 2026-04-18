from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import asyncio
import json
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATS_FILE = "stats.json"

def load_stats():
    if os.path.exists(STATS_FILE):
        with open(STATS_FILE) as f:
            return json.load(f)
    return {"total_seconds": 0}

def save_stats(stats):
    with open(STATS_FILE, "w") as f:
        json.dump(stats, f)

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/stats")
def get_stats():
    return load_stats()

@app.post("/stats/add-time")
def add_time(seconds: int = Body(..., embed=True)):
    stats = load_stats()
    stats["total_seconds"] += seconds
    save_stats(stats)
    return stats

@app.get("/timer/{seconds}")
async def timer_stream(seconds: int):
    async def generate(s):
        while s > 0:
            mins, secs = divmod(s, 60)
            yield f"data: {str(mins).zfill(2)}:{str(secs).zfill(2)}\n\n"
            await asyncio.sleep(1)
            s -= 1
        yield "data: DONE\n\n"
    return StreamingResponse(generate(seconds), media_type="text/event-stream")