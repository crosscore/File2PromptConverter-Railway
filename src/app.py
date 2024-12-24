# File2PromptConverter/src/app.py
import os
from fastapi import FastAPI, File, UploadFile, Request, HTTPException
from fastapi.responses import HTMLResponse, PlainTextResponse, JSONResponse, Response
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from src.utils.file_processor import FileProcessor
from src.utils.data_manager import DataManager

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

# DataManagerのインスタンス作成
data_manager = DataManager(os.path.dirname(BASE_DIR))

@app.get("/", response_class=HTMLResponse)
async def get_form(request: Request):
    """ファイルアップロードフォームを表示する"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload", response_class=PlainTextResponse)
async def upload_files(files: List[UploadFile] = File(...)):
    """複数のファイルをアップロードし、テキスト化して返す"""
    try:
        contents = []
        filenames = []
        for file in files:
            content = await file.read()
            decoded_content = content.decode('utf-8')
            formatted_content = FileProcessor.format_file_content(
                file.filename,
                decoded_content
            )
            contents.append(formatted_content)
            filenames.append(file.filename)

        result_text = "\n\n".join(contents)
        return PlainTextResponse(result_text)
    except Exception as e:
        return PlainTextResponse(f"Error processing files: {str(e)}", status_code=500)

@app.post("/save")
async def save_data(files: List[UploadFile] = File(...)):
    """ファイルをアップロードし、保存する"""
    try:
        contents = []
        filenames = []
        for file in files:
            content = await file.read()
            decoded_content = content.decode('utf-8')
            formatted_content = FileProcessor.format_file_content(
                file.filename,
                decoded_content
            )
            contents.append(formatted_content)
            filenames.append(file.filename)

        result_text = "\n\n".join(contents)
        save_result = data_manager.save_data(result_text, filenames)
        return JSONResponse(content=save_result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history")
async def get_history():
    """保存された履歴の一覧を取得"""
    try:
        history = data_manager.get_history()
        return JSONResponse(content=history)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/data/{data_id}")
async def get_data(data_id: str):
    """特定のデータを取得"""
    try:
        data = data_manager.get_data(data_id)
        if data is None:
            raise HTTPException(status_code=404, detail="Data not found")
        return JSONResponse(content=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download/{data_id}/{filename}")
async def download_file(data_id: str, filename: str):
    """特定のファイルをダウンロード"""
    try:
        content = data_manager.get_original_file_content(data_id, filename)
        if content is None:
            raise HTTPException(status_code=404, detail="File not found")

        return Response(
            content=content,
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/data/{data_id}")
async def delete_data(data_id: str):
    """特定のデータを削除"""
    try:
        success = data_manager.delete_data(data_id)
        if not success:
            raise HTTPException(status_code=404, detail="Data not found")
        return JSONResponse(content={"message": "Data deleted successfully"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/data")
async def delete_all_data():
    """全てのデータを削除"""
    try:
        success = data_manager.delete_all()
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete all data")
        return JSONResponse(content={"message": "All data deleted successfully"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
