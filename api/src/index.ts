// Azure Functions V4のTypeScript版エントリーポイント
// 関数定義は各ファイルで行っているため、このファイルは空でも問題ありません
// app.tsスタイルのプログラミングモデルを使用しています

import { app } from '@azure/functions';

// 全ての関数をインポート
import './functions/extractContent';
import './functions/collectLinks';
import './functions/sansuUsers';
import './functions/sansuSessions';
import './functions/sansuAdminUsers';
import './functions/sansuAdminPinReset';
import './functions/sansuAdminSummary';

// 明示的なエクスポート
export { app };
