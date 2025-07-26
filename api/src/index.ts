// Azure Functions V4のTypeScript版エントリーポイント
// 関数定義は各ファイルで行っているため、このファイルは空でも問題ありません
// app.tsスタイルのプログラミングモデルを使用しています

import { app } from '@azure/functions';

// 全ての関数をインポート
import './functions/extractContent';
import './functions/collectLinks';

// 明示的なエクスポート
export { app };
