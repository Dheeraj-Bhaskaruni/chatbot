import os
from dotenv import load_dotenv
load_dotenv()  # this reads .env in the current working directory

from flask import Flask, request, jsonify, render_template

app = Flask(__name__)
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

@app.get("/")
def index():
    return render_template("index.html")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/chat")
def chat():
    data = request.get_json(silent=True) or {}
    text = (data.get("message") or "").strip()
    if not text:
        return jsonify({"error": "Empty message"}), 400

    api_key = os.environ.get("OPENAI_API_KEY")  # ✅ correct env var
    if not api_key:
        return jsonify({
            "reply": "⚠️ Server missing OPENAI_API_KEY. Set it in cPanel → Setup Python App → Environment Variables."
        })

    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        resp = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are concise."},
                {"role": "user",   "content": text},
            ],
            temperature=0.7,
        )
        return jsonify({"reply": resp.choices[0].message.content})
    except Exception:
        return jsonify({"error": "Upstream call failed. Check server logs."}), 500

@app.get("/envcheck")
def envcheck():
    val = os.environ.get("OPENAI_API_KEY")
    return {
        "has_key": bool(val),
        "len": (len(val) if val else 0),
        "model": os.environ.get("OPENAI_MODEL")
    }
