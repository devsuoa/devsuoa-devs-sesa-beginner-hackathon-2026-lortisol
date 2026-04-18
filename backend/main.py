from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import time
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Backend is reachable! Testing successful"}

@app.get("/timer/{seconds}")
async def timer_stream(seconds: int):
    async def generate(s):
        while s > 0:
            mins, secs = divmod(s, 60)
            timer = '{:02d}:{:02d}'.format(mins, secs)
            yield f"data: {timer}\n\n"
            await asyncio.sleep(1)
            s -= 1
        yield "data: DONE\n\n"
    return StreamingResponse(generate(seconds), media_type="text/event-stream")