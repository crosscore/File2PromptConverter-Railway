# src/app.py
import os
from fastapi import FastAPI, File, UploadFile, Request
from fastapi.responses import HTMLResponse, PlainTextResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from src.utils.file_processor import FileProcessor

app = FastAPI()

# CORSミドルウェアの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ベースディレクトリとテンプレートディレクトリの設定
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
templates_dir = os.path.join(BASE_DIR, "templates")
static_dir = os.path.join(BASE_DIR, "static")

# ディレクトリが存在しない場合は作成
os.makedirs(templates_dir, exist_ok=True)
os.makedirs(static_dir, exist_ok=True)

# 静的ファイルのマウント
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Jinja2テンプレートの設定
templates = Jinja2Templates(directory=templates_dir)

@app.get("/", response_class=HTMLResponse)
async def get_form(request: Request):
    """ファイルアップロードフォームを表示する"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload", response_class=PlainTextResponse)
async def upload_files(files: List[UploadFile] = File(...)):
    """複数のファイルをアップロードし、テキスト化して返す"""
    try:
        contents = []
        for file in files:
            content = await file.read()
            decoded_content = content.decode('utf-8')
            formatted_content = FileProcessor.format_file_content(
                file.filename,
                decoded_content
            )
            contents.append(formatted_content)

        result_text = "\n\n".join(contents)
        return PlainTextResponse(result_text)
    except Exception as e:
        return PlainTextResponse(f"Error processing files: {str(e)}", status_code=500)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
