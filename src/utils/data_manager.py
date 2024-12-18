# File2PromptConverter/src/utils/data_manager.py
import os
import json
import uuid
from typing import Dict, List, Optional
from datetime import datetime

class DataManager:
    """データの保存と管理を行うクラス"""

    def __init__(self, base_dir: str):
        """
        初期化

        Args:
            base_dir (str): プロジェクトのルートディレクトリパス
        """
        self.data_dir = os.path.join(base_dir, 'data', 'exports')
        self._ensure_data_directory()

    def _ensure_data_directory(self) -> None:
        """データディレクトリが存在することを確認し、なければ作成"""
        os.makedirs(self.data_dir, exist_ok=True)

    def _generate_filename(self) -> str:
        """
        一意のファイル名を生成

        Returns:
            str: タイムスタンプとUUIDを組み合わせたファイル名
        """
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_id = str(uuid.uuid4())[:8]
        return f"{timestamp}_{unique_id}.json"

    def save_data(self, content: str, original_filenames: List[str]) -> Dict:
        """
        データを保存

        Args:
            content (str): 保存する内容
            original_filenames (List[str]): 元のファイル名のリスト

        Returns:
            Dict: 保存したデータの情報
        """
        filename = self._generate_filename()
        data = {
            'id': filename.split('.')[0],
            'timestamp': datetime.now().isoformat(),
            'original_files': original_filenames,
            'file_count': len(original_filenames),
            'content': content
        }

        file_path = os.path.join(self.data_dir, filename)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        return {
            'id': data['id'],
            'timestamp': data['timestamp'],
            'original_files': data['original_files'],
            'file_count': data['file_count']
        }

    def get_history(self) -> List[Dict]:
        """
        保存された履歴の一覧を取得

        Returns:
            List[Dict]: 履歴の一覧
        """
        history = []
        for filename in sorted(os.listdir(self.data_dir), reverse=True):
            if filename.endswith('.json'):
                file_path = os.path.join(self.data_dir, filename)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        # content は一覧表示時には不要なので除外
                        history.append({
                            'id': data['id'],
                            'timestamp': data['timestamp'],
                            'original_files': data['original_files'],
                            'file_count': data['file_count']
                        })
                except (json.JSONDecodeError, KeyError):
                    continue
        return history

    def get_data(self, data_id: str) -> Optional[Dict]:
        """
        特定のデータを取得

        Args:
            data_id (str): データID

        Returns:
            Optional[Dict]: 保存されたデータ、存在しない場合はNone
        """
        for filename in os.listdir(self.data_dir):
            if filename.startswith(data_id) and filename.endswith('.json'):
                file_path = os.path.join(self.data_dir, filename)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        return json.load(f)
                except (json.JSONDecodeError, KeyError):
                    return None
        return None

    def delete_data(self, data_id: str) -> bool:
        """
        特定のデータを削除

        Args:
            data_id (str): 削除するデータのID

        Returns:
            bool: 削除成功ならTrue、失敗ならFalse
        """
        for filename in os.listdir(self.data_dir):
            if filename.startswith(data_id) and filename.endswith('.json'):
                file_path = os.path.join(self.data_dir, filename)
                try:
                    os.remove(file_path)
                    return True
                except OSError:
                    return False
        return False

    def delete_all(self) -> bool:
        """
        全てのデータを削除

        Returns:
            bool: 削除成功ならTrue、失敗ならFalse
        """
        try:
            for filename in os.listdir(self.data_dir):
                if filename.endswith('.json'):
                    file_path = os.path.join(self.data_dir, filename)
                    os.remove(file_path)
            return True
        except OSError:
            return False
