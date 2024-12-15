# File2PromptConverter

File2PromptConverter/          # プロジェクトルート
├── main.py                    # エントリーポイント
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── README.md
└── src/                       # ソースコードディレクトリ
    ├── __init__.py            # Pythonパッケージ化
    ├── app.py                 # FastAPIアプリケーション本体
    ├── utils/                 # ユーティリティモジュール
    │   ├── __init__.py
    │   └── file_processor.py  # ファイル処理クラス
    ├── static/                # 静的ファイル
    │   ├── style.css
    │   ├── scripts.js         # クライアントサイドスクリプト
    │   └── favicon.ico        
    └── templates/             # HTMLテンプレート
        └── index.html         # メインページ
