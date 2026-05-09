import os
import numpy as np
import cv2
import requests
import json
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ── Load model from weights + config (committed directly to repo) ─────────────
WEIGHTS_PATH = "emotion_weights.weights.h5"
CONFIG_PATH  = "model_config.json"

from tensorflow.keras.models import model_from_json

with open(CONFIG_PATH, "r") as f:
    model = model_from_json(f.read())

model.load_weights(WEIGHTS_PATH)
print("Model loaded!")

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Config ────────────────────────────────────────────────────────────────────
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")

EMOTION_LABELS = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
EMOTION_MAP = {
    'angry': 'angry', 'disgust': 'angry', 'fear': 'fear',
    'happy': 'happy', 'neutral': 'neutral', 'sad': 'sad', 'surprise': 'surprise'
}

LANGUAGE_TERMS = {
    "Tamil":     "Tamil தமிழ்",
    "Hindi":     "Hindi हिंदी",
    "Telugu":    "Telugu తెలుగు",
    "English":   "English",
    "Malayalam": "Malayalam മലയാളം",
    "Kannada":   "Kannada ಕನ್ನಡ",
    "Punjabi":   "Punjabi ਪੰਜਾਬੀ",
}

MOOD_QUERIES = {
    "happy": {
        "match": [
            "{lang} super hit happy songs",
            "{lang} peppy dance songs hits",
            "{lang} feel good chartbusters",
            "{lang} upbeat fun songs playlist",
            "{lang} happy wedding songs",
        ],
        "opposite": [
            "{lang} melody soft relaxing songs",
            "{lang} calm peaceful lofi songs",
            "{lang} slow instrumental music",
            "{lang} soothing night songs",
            "{lang} soft romantic melody",
        ],
    },
    "sad": {
        "match": [
            "{lang} sad melody heart touching songs",
            "{lang} emotional breakup songs",
            "{lang} melancholy slow songs",
            "{lang} painful heart songs",
            "{lang} lonely night sad songs",
        ],
        "opposite": [
            "{lang} super hit peppy motivational songs",
            "{lang} energy boost happy songs",
            "{lang} feel good cheerful songs",
            "{lang} uplifting inspirational songs",
            "{lang} positive vibes songs",
        ],
    },
    "angry": {
        "match": [
            "{lang} mass BGM energetic beat songs",
            "{lang} powerful mass songs",
            "{lang} intense action songs",
            "{lang} bass boosted aggressive songs",
            "{lang} high energy workout songs",
        ],
        "opposite": [
            "{lang} soft calm melody songs",
            "{lang} peaceful devotional songs",
            "{lang} soothing stress relief songs",
            "{lang} gentle slow songs",
            "{lang} calm yoga meditation music",
        ],
    },
    "fear": {
        "match": [
            "{lang} thriller suspense bgm songs",
            "{lang} dark mysterious songs",
            "{lang} horror bgm music",
            "{lang} intense dramatic songs",
            "{lang} dark moody songs",
        ],
        "opposite": [
            "{lang} motivational confidence songs",
            "{lang} courage inspiring songs",
            "{lang} bold powerful songs",
            "{lang} fearless strong songs",
            "{lang} positive upbeat motivational",
        ],
    },
    "neutral": {
        "match": [
            "{lang} latest trending hit songs 2024",
            "{lang} top chart songs this year",
            "{lang} most popular songs playlist",
            "{lang} new hit songs 2024",
            "{lang} viral songs playlist",
        ],
        "opposite": [
            "{lang} party dance songs",
            "{lang} high energy party hits",
            "{lang} club dance songs",
            "{lang} DJ remix songs",
            "{lang} dance floor hits",
        ],
    },
    "surprise": {
        "match": [
            "{lang} celebration special songs",
            "{lang} festival songs hits",
            "{lang} party celebration songs",
            "{lang} joyful fun songs",
            "{lang} exciting happy celebration",
        ],
        "opposite": [
            "{lang} peaceful lofi melody songs",
            "{lang} calm chill songs",
            "{lang} slow peaceful songs",
            "{lang} soft night songs",
            "{lang} relaxing ambient songs",
        ],
    },
}

EMOTION_COLORS = {
    "happy": "#FFD93D", "sad": "#6C9BCF", "angry": "#FF6B6B",
    "fear": "#A29BFE", "neutral": "#B2BEC3", "surprise": "#FD79A8",
}
EMOTION_EMOJIS = {
    "happy": "😄", "sad": "😢", "angry": "😠",
    "fear": "😨", "neutral": "😐", "surprise": "😲",
}

# ── Helpers ───────────────────────────────────────────────────────────────────
def detect_emotion(image_bytes):
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        return None, None, "Could not decode image."
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)
    if len(faces) == 0:
        return None, None, "No face detected. Try a clearer photo."
    x, y, w, h = faces[0]
    face_crop = gray[y:y+h, x:x+w]
    face_resized = cv2.resize(face_crop, (48, 48))
    img_array = face_resized / 255.0
    img_array = np.expand_dims(img_array, axis=(0, -1))
    predictions = model.predict(img_array)[0]
    emotion_index = np.argmax(predictions)
    raw_emotion = EMOTION_LABELS[emotion_index]
    emotion = EMOTION_MAP[raw_emotion]
    confidence = float(predictions[emotion_index]) * 100
    all_scores = {}
    for i in range(len(EMOTION_LABELS)):
        mapped = EMOTION_MAP[EMOTION_LABELS[i]]
        score = round(float(predictions[i]) * 100, 1)
        all_scores[mapped] = all_scores.get(mapped, 0) + score
    return emotion, round(confidence, 1), all_scores


def search_youtube(query, max_results=6, page_token=None):
    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "videoCategoryId": "10",
        "maxResults": max_results,
        "key": YOUTUBE_API_KEY,
    }
    if page_token:
        params["pageToken"] = page_token
    res = requests.get(url, params=params)
    if res.status_code != 200:
        print("YouTube API error:", res.text)
        return [], None
    data = res.json()
    songs = []
    for item in data.get("items", []):
        vid_id = item["id"].get("videoId")
        if not vid_id:
            continue
        songs.append({
            "title":     item["snippet"]["title"],
            "channel":   item["snippet"]["channelTitle"],
            "thumbnail": item["snippet"]["thumbnails"]["medium"]["url"],
            "video_id":  vid_id,
            "embed_url": f"https://www.youtube.com/embed/{vid_id}?autoplay=1",
            "url":       f"https://www.youtube.com/watch?v={vid_id}",
        })
    return songs, data.get("nextPageToken")


# ── Routes ────────────────────────────────────────────────────────────────────
@app.post("/detect")
async def detect(
    file: UploadFile = File(...),
    language: str = Form("Tamil"),
    mood_type: str = Form("match"),
):
    image_bytes = await file.read()
    emotion, confidence, all_scores = detect_emotion(image_bytes)
    if emotion is None:
        return JSONResponse({"error": all_scores}, status_code=400)
    lang_term = LANGUAGE_TERMS.get(language, language)
    query = MOOD_QUERIES[emotion][mood_type][0].replace("{lang}", lang_term)
    songs, next_page_token = search_youtube(query, max_results=6)
    return {
        "emotion": emotion, "confidence": confidence,
        "all_scores": all_scores, "color": EMOTION_COLORS[emotion],
        "emoji": EMOTION_EMOJIS[emotion], "songs": songs,
        "language": language, "query_used": query,
        "next_page_token": next_page_token,
        "query_index": 0,
    }


@app.post("/more")
async def more_songs(
    emotion: str = Form(...),
    language: str = Form(...),
    mood_type: str = Form("match"),
    query_index: int = Form(0),
    page_token: str = Form(None),
    seen_ids: str = Form(""),
):
    lang_term = LANGUAGE_TERMS.get(language, language)
    queries = MOOD_QUERIES.get(emotion, {}).get(mood_type, ["{lang} songs"])
    seen = set(seen_ids.split(",")) if seen_ids else set()

    all_new_songs = []
    current_index = query_index
    current_token = page_token
    attempts = 0

    while len(all_new_songs) < 6 and attempts < 8:
        q = queries[current_index % len(queries)].replace("{lang}", lang_term)
        songs, next_token = search_youtube(q, max_results=10, page_token=current_token)

        for s in songs:
            if s["video_id"] not in seen:
                seen.add(s["video_id"])
                all_new_songs.append(s)
                if len(all_new_songs) >= 6:
                    break

        if not next_token or len(songs) == 0:
            current_index += 1
            current_token = None
        else:
            current_token = next_token

        attempts += 1

    return {
        "songs": all_new_songs[:6],
        "next_page_token": current_token,
        "query_index": current_index,
    }


@app.get("/health")
def health():
    return {"status": "ok", "model": "loaded"}