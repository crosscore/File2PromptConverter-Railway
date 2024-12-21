# File2PromptConverter/src/utils/file_processor.py
"""
ファイル処理に関する機能を提供するモジュール
"""
import os
import json
from typing import Dict

class FileProcessor:
    @staticmethod
    def get_file_extension(filename: str) -> str:
        """
        ファイル名またはパスから適切な言語識別子を返す
        特殊なファイル名と拡張子の両方に対応
        """
        # 特殊なファイル名のマッピング
        special_files: Dict[str, str] = {
            'dockerfile': 'dockerfile',
            'dockerfile.dev': 'dockerfile',
            'dockerfile.prod': 'dockerfile',
            'makefile': 'makefile',
            'readme': 'markdown',
            'readme.md': 'markdown',
            'package.json': 'json',
            'tsconfig.json': 'json',
            'composer.json': 'json',
            '.gitignore': 'gitignore',
            '.env': 'env',
            'requirements.txt': 'text',
            'license': 'text',
        }

        # ファイル名を小文字に変換
        filename_lower = filename.lower()

        # 特殊なファイル名かチェック
        if filename_lower in special_files:
            return special_files[filename_lower]

        # 拡張子の取得
        ext = os.path.splitext(filename_lower)[1]

        # 拡張子のマッピング
        extension_map: Dict[str, str] = {
            # Web開発
            '.js': 'javascript',
            '.jsx': 'jsx',
            '.ts': 'typescript',
            '.tsx': 'tsx',
            '.html': 'html',
            '.htm': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.sass': 'sass',
            '.less': 'less',
            '.vue': 'vue',
            '.svelte': 'svelte',

            # プログラミング言語
            '.py': 'python',
            '.ipynb': 'jupyter',
            '.java': 'java',
            '.c': 'c',
            '.h': 'c',
            '.cpp': 'cpp',
            '.cc': 'cpp',
            '.hpp': 'cpp',
            '.cs': 'csharp',
            '.go': 'go',
            '.rs': 'rust',
            '.rb': 'ruby',
            '.php': 'php',
            '.kt': 'kotlin',
            '.kts': 'kotlin',
            '.swift': 'swift',
            '.scala': 'scala',
            '.r': 'r',
            '.dart': 'dart',
            '.lua': 'lua',
            '.pl': 'perl',
            '.sh': 'shell',
            '.bash': 'bash',
            '.zsh': 'shell',
            '.fish': 'shell',

            # マークアップ/データ
            '.xml': 'xml',
            '.svg': 'svg',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.json': 'json',
            '.md': 'markdown',
            '.tex': 'latex',
            '.sql': 'sql',
            '.graphql': 'graphql',
            '.gql': 'graphql',

            # その他のテキストファイル
            '.txt': 'text',
            '.log': 'text',
            '.csv': 'csv',
            '.ini': 'ini',
            '.conf': 'conf',
            '.toml': 'toml',
            '.properties': 'properties',
            '.gradle': 'gradle',
        }

        return extension_map.get(ext, 'text')

    @staticmethod
    def process_jupyter_notebook(content: str) -> str:
        """Jupyter Notebookの内容を処理する"""
        try:
            notebook = json.loads(content)
            cells = []
            for cell in notebook.get('cells', []):
                cell_type = cell.get('cell_type', '')
                source = ''.join(cell.get('source', []))
                if cell_type == 'code':
                    cells.append(f"```python\n{source}\n```")
                elif cell_type in ['markdown', 'raw']:
                    cells.append(f"```markdown\n{source}\n```")
            return '\n\n'.join(cells)
        except json.JSONDecodeError:
            return "Error: Invalid Jupyter Notebook format"

    @staticmethod
    def format_file_content(filename: str, content: str) -> str:
        """ファイルの内容をフォーマットする"""
        lang_identifier = FileProcessor.get_file_extension(filename)

        # Jupyter Notebookの場合は特別な処理
        if lang_identifier == 'jupyter':
            formatted_content = FileProcessor.process_jupyter_notebook(content)
        else:
            formatted_content = content

        file_header = f"# {filename}\n```{lang_identifier}\n"
        file_footer = "\n```\n"
        return f"{file_header}{formatted_content}{file_footer}"
